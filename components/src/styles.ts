/**
 * Premium Reveal stylesheet — luxury editorial (Obsidian / Champagne Gold / Ivory).
 * Elegant, restrained motion; sequential reveal; honors prefers-reduced-motion;
 * responsive desktop → mobile. Injected once per document; scoped to `.pr-*`.
 */
export const STYLE_ELEMENT_ID = 'cb-premium-reveal-styles';

export const PREMIUM_REVEAL_CSS = `
:root {
  --pr-obsidian: #0C0E14; --pr-obsidian2:#141824; --pr-gold:#C9A84C; --pr-gold2:#E8C97A;
  --pr-ivory:#FAF8F3; --pr-muted:rgba(250,248,243,0.62); --pr-border:rgba(201,168,76,0.22);
  --pr-serif:'Cormorant Garamond', Georgia, serif; --pr-sans:'Outfit', system-ui, sans-serif;
}
.pr-root { background:var(--pr-obsidian); color:var(--pr-ivory); font-family:var(--pr-sans);
  padding:2.5rem 1.5rem 3rem; max-width:1200px; margin:0 auto; }
.pr-visually-hidden { position:absolute!important; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }

/* Header */
.pr-title { font-family:var(--pr-serif); font-weight:700; font-size:clamp(28px,5vw,46px);
  text-align:center; margin:0 0 .5rem; color:var(--pr-ivory); letter-spacing:.5px; }
.pr-subtitle { text-align:center; color:var(--pr-muted); font-size:clamp(14px,2vw,17px);
  max-width:640px; margin:0 auto 2rem; line-height:1.5; }

/* Loading sequence */
.pr-loading { max-width:520px; margin:1rem auto; }
.pr-loading-title { font-family:var(--pr-serif); font-size:24px; text-align:center; margin:0 0 1.25rem; }
.pr-stages { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.pr-stage { display:flex; align-items:center; gap:14px; padding:10px 14px; border-radius:12px;
  border:1px solid transparent; transition:all .4s ease; opacity:.45; }
.pr-stage-dot { width:22px; height:22px; border-radius:50%; flex:none; border:2px solid var(--pr-border);
  display:grid; place-items:center; font-size:12px; color:var(--pr-obsidian); }
.pr-stage-label { font-size:15px; }
.pr-stage--pending { opacity:.4; }
.pr-stage--active { opacity:1; border-color:var(--pr-border); background:rgba(201,168,76,0.06); }
.pr-stage--active .pr-stage-dot { border-color:var(--pr-gold);
  animation:pr-pulse 1.2s ease-in-out infinite; }
.pr-stage--done { opacity:1; }
.pr-stage--done .pr-stage-dot { background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2));
  border-color:var(--pr-gold); }
.pr-stage--done .pr-stage-dot::after { content:'✓'; font-weight:800; }

/* Director's choice note + gallery */
.pr-directors-note { text-align:center; color:var(--pr-gold2); font-size:13px; letter-spacing:.12em;
  text-transform:uppercase; font-weight:700; margin:0 0 1.25rem; }
.pr-gallery { display:grid; grid-template-columns:repeat(2,1fr); gap:22px; }

/* Concept card */
.pr-card { position:relative; background:var(--pr-obsidian2); border:1px solid var(--pr-border);
  border-radius:18px; overflow:hidden; display:flex; flex-direction:column;
  opacity:0; transform:translateY(16px); animation:pr-rise .6s ease forwards;
  animation-delay:calc(var(--pr-index,0) * 120ms); }
.pr-card:focus-within, .pr-card:hover { border-color:var(--pr-gold); }
.pr-card--directors { border-color:var(--pr-gold);
  box-shadow:0 0 0 1px var(--pr-gold), 0 18px 50px rgba(201,168,76,0.14); }
.pr-card-preview { aspect-ratio:4/3; background:
  linear-gradient(135deg, rgba(201,168,76,0.10), rgba(12,14,20,0.6)); display:grid; place-items:center;
  color:var(--pr-muted); font-size:13px; letter-spacing:.1em; text-transform:uppercase;
  border-bottom:1px solid var(--pr-border); }
.pr-card-preview-mark { text-align:center; }
.pr-card-topline { display:flex; align-items:center; justify-content:space-between; gap:12px;
  position:absolute; top:12px; left:12px; right:12px; }
.pr-card-body { padding:18px 20px 20px; display:flex; flex-direction:column; gap:12px; flex:1; }
.pr-card-name { font-family:var(--pr-serif); font-weight:700; font-size:24px; margin:0; }
.pr-card-title { color:var(--pr-gold2); font-size:14px; margin:-6px 0 0; }
.pr-card-explanation { color:rgba(250,248,243,0.82); font-size:13.5px; line-height:1.5; margin:0; }
.pr-card-product { font-size:12.5px; color:var(--pr-ivory); }
.pr-card-product b { color:var(--pr-gold2); }
.pr-card-psychology { font-size:12.5px; color:var(--pr-muted); font-style:italic; line-height:1.45; margin:0; }
.pr-card-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:auto; padding-top:6px; }

/* WOW score */
.pr-score { display:inline-flex; align-items:baseline; gap:3px; background:rgba(12,14,20,0.72);
  border:1px solid var(--pr-border); border-radius:999px; padding:5px 11px; backdrop-filter:blur(4px); }
.pr-score-num { font-family:var(--pr-serif); font-weight:700; font-size:18px; color:var(--pr-gold2); }
.pr-score-max { font-size:11px; color:var(--pr-muted); }

/* Masterpiece badge */
.pr-badge { display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:800;
  letter-spacing:.08em; text-transform:uppercase; color:var(--pr-obsidian); border-radius:999px;
  padding:5px 10px; background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2));
  box-shadow:0 4px 14px rgba(201,168,76,0.35); }
.pr-badge--pending { color:var(--pr-muted); background:transparent; border:1px solid var(--pr-border); }

/* Director choice ribbon */
.pr-choice { display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:800;
  letter-spacing:.1em; text-transform:uppercase; color:var(--pr-gold2); }

/* Buttons */
.pr-btn { font-family:var(--pr-sans); font-size:12.5px; font-weight:700; padding:9px 14px;
  border-radius:999px; cursor:pointer; border:1px solid var(--pr-border); background:transparent;
  color:var(--pr-ivory); transition:all .2s ease; }
.pr-btn:hover { border-color:var(--pr-gold); }
.pr-btn:focus-visible { outline:2px solid var(--pr-gold2); outline-offset:2px; }
.pr-btn--love { background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2)); color:var(--pr-obsidian);
  border-color:transparent; }

@keyframes pr-rise { to { opacity:1; transform:none; } }
@keyframes pr-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(201,168,76,0.5);} 50%{ box-shadow:0 0 0 6px rgba(201,168,76,0);} }

@media (max-width:720px) {
  .pr-gallery { grid-template-columns:1fr; }
  .pr-root { padding:1.75rem 1rem 2.5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .pr-card { animation:none; opacity:1; transform:none; }
  .pr-stage, .pr-btn { transition:none; }
  .pr-stage--active .pr-stage-dot { animation:none; }
}
`;

/** Inject the stylesheet once into a document (idempotent). */
export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ELEMENT_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = PREMIUM_REVEAL_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}
