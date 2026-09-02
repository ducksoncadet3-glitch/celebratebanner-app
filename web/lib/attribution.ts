/**
 * First-party campaign attribution.
 *
 * Captures utm_* from the landing URL and keeps it for the rest of the visit, so a visitor
 * who arrives on a product page from Instagram is still attributed to Instagram when they
 * check out several navigations later.
 *
 * Deliberately small and non-invasive:
 *   • localStorage on our own origin — no third-party cookie, no cross-site tracking.
 *   • NO fingerprinting: `attributionId` is a random value from crypto.getRandomValues,
 *     derived from nothing about the device or person.
 *   • First touch wins. A later untagged navigation must not overwrite the campaign that
 *     actually brought the visitor; a NEW campaign link does overwrite it.
 *   • Every read is defensive — private mode, disabled storage or corrupt JSON degrade to
 *     "direct" rather than throwing. Attribution must never block a purchase.
 */

const STORAGE_KEY = 'cb_attribution_v1';
/** A campaign is remembered for 30 days, then a fresh visit counts as direct. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface Attribution {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  attributionId: string;
  capturedAt: number;
}

export const DIRECT: Omit<Attribution, 'attributionId' | 'capturedAt'> = {
  utmSource: 'direct',
  utmMedium: 'direct',
  utmCampaign: 'unknown',
  utmContent: null,
};

function randomId(): string {
  try {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Not security-sensitive — it only joins a view to a checkout.
    return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

function clean(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.trim().toLowerCase().slice(0, 64);
  return s || null;
}

/** Parse utm_* from a query string. Returns null when there is no utm_source. */
export function parseAttribution(search: string): Partial<Attribution> | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  const source = clean(params.get('utm_source'));
  if (!source) return null; // no campaign tag → not a campaign arrival
  return {
    utmSource: source,
    utmMedium: clean(params.get('utm_medium')) ?? 'unknown',
    utmCampaign: clean(params.get('utm_campaign')) ?? 'unknown',
    utmContent: clean(params.get('utm_content')),
  };
}

function read(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed || typeof parsed.utmSource !== 'string') return null;
    if (Date.now() - (parsed.capturedAt ?? 0) > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(a: Attribution): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* private mode / quota — the visit is simply attributed as direct */
  }
}

/**
 * Capture attribution from the current URL if present, otherwise keep what is stored.
 * Call once on entry. Returns the attribution that now applies to this visit.
 */
export function captureAttribution(search?: string): Attribution {
  if (typeof window === 'undefined') {
    return { ...DIRECT, attributionId: '', capturedAt: 0 };
  }
  const stored = read();
  const incoming = parseAttribution(search ?? window.location.search);

  if (incoming) {
    // A campaign link always wins — including over an older campaign, so the most recent
    // creative that actually drove the visit gets the credit.
    const next: Attribution = {
      utmSource: incoming.utmSource!,
      utmMedium: incoming.utmMedium!,
      utmCampaign: incoming.utmCampaign!,
      utmContent: incoming.utmContent ?? null,
      attributionId: stored?.attributionId ?? randomId(),
      capturedAt: Date.now(),
    };
    write(next);
    return next;
  }

  if (stored) return stored; // untagged navigation must not erase the campaign

  const fresh: Attribution = { ...DIRECT, attributionId: randomId(), capturedAt: Date.now() };
  write(fresh);
  return fresh;
}

/** Current attribution without capturing. Safe on the server (returns direct). */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') {
    return { ...DIRECT, attributionId: '', capturedAt: 0 };
  }
  return read() ?? { ...DIRECT, attributionId: '', capturedAt: 0 };
}

/** The shape sent to the API with a checkout. */
export function attributionPayload(a: Attribution = getAttribution()) {
  return {
    utmSource: a.utmSource,
    utmMedium: a.utmMedium,
    utmCampaign: a.utmCampaign,
    utmContent: a.utmContent,
    attributionId: a.attributionId,
  };
}

/** Fire-and-forget product_view. Never throws, never blocks rendering. */
export function trackProductView(productSlug: string, productMode?: string): void {
  if (typeof window === 'undefined') return;
  const a = captureAttribution();
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  try {
    void fetch(`${base}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'product_view',
        productSlug,
        productMode,
        ...attributionPayload(a),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the page */
  }
}
