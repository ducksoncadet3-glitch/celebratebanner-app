/**
 * Branded placeholder poster generator.
 *
 * The repo ships no product photography in /public (it is empty), so — exactly like the
 * Sprint-002 football collection — every catalog image is an on-brand inline-SVG data URI:
 * obsidian → gold, a product label, and a "SAMPLE DESIGN" mark. This guarantees no broken
 * images and no external hotlinking. Swap these for real photography by changing only the
 * `image`/`gallery` fields in the catalog data — nothing else references image bytes.
 *
 * PLACEHOLDER NOTE: all 24 launch products currently use these generated placeholders.
 */

export type PosterAspect = '4x5' | '16x9' | '1x1';

export function poster(label: string, sub: string, aspect: PosterAspect = '4x5'): string {
  const dims: Record<PosterAspect, [number, number]> = {
    '4x5': [900, 1125],
    '16x9': [1600, 900],
    '1x1': [1080, 1080],
  };
  const [w, h] = dims[aspect];
  const titleSize = aspect === '16x9' ? 72 : aspect === '1x1' ? 84 : 66;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#0C0E14"/><stop offset="0.6" stop-color="#1B1F2C"/><stop offset="1" stop-color="#13161F"/>
</linearGradient>
<radialGradient id="glow" cx="0.7" cy="0.15" r="0.8">
<stop offset="0" stop-color="#C9A84C" stop-opacity="0.28"/><stop offset="0.6" stop-color="#C9A84C" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#C9A84C" stroke-opacity="0.35" stroke-width="3" rx="16"/>
<text x="${w / 2}" y="${h / 2 - 8}" fill="#F5E4B0" font-family="Georgia, serif" font-size="${titleSize}" font-weight="700" text-anchor="middle">${escapeXml(label)}</text>
<text x="${w / 2}" y="${h / 2 + 48}" fill="#FAF8F3" fill-opacity="0.7" font-family="system-ui, sans-serif" font-size="26" letter-spacing="6" text-anchor="middle">${escapeXml(sub.toUpperCase())}</text>
<text x="${w / 2}" y="${h - 56}" fill="#C9A84C" fill-opacity="0.85" font-family="system-ui, sans-serif" font-size="20" letter-spacing="3" text-anchor="middle">SAMPLE DESIGN</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));
}
