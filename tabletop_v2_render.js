// Tabletop v2 — 9-photo layout investigation harness.
// Generates 18 layout mockups (A1-A9 portrait-hero, B1-B9 landscape-hero) + 2 contact sheets.
// Each layout: 1 hero (locked) + 8 supporting cells with correct orientation aspect ratios.

const { createCanvas } = require('./node_modules/canvas');
const fs = require('fs');
const path = require('path');

const W = 789, H = 1200;
const GAP = 10;

// CelebrateBanner palette
const COL = {
  bg:        '#0C0E14',  // obsidian
  gold:      '#C9A84C',
  goldDim:   'rgba(201,168,76,0.35)',
  ivory:     '#FAF8F3',
  ivoryDim:  'rgba(250,248,243,0.55)',
  portrait:  '#C9A84C',  // gold cells
  landscape: '#4A9ECC',  // sky cells
  square:    '#5A8F6A',  // sage cells
  heroFill:  '#1A1612',
  shadow:    'rgba(0,0,0,0.6)',
};

// Family hero positions (locked geometry).
const HEROES = {
  A: { x: 30, y: 60, w: 380, h: 507, kind: 'portrait' },   // 3/4 portrait
  B: { x: 30, y: 60, w: 729, h: 400, kind: 'landscape' },  // wide landscape
};

// Anchor regions for A family (right of hero + below hero).
const A_STRIP = { x: 420, y: 60,  w: 339, h: 507 };  // right of hero
const A_BELOW = { x: 30,  y: 587, w: 729, h: 583 };  // below hero (1200-587=613 actually, with bottom margin 30 → 583)
// Anchor region for B family (below hero).
const B_BELOW = { x: 30,  y: 480, w: 729, h: 690 };  // below landscape hero

// Aspect ratios
const AR = { P: 3/4, L: 4/3 };

// gridFit: produce cells of `type` filling area exactly OR fitting by aspect, whichever produces aspect-correct cells.
// Returns {cells, used: {w, h, x, y}} where used is the bounding box.
function gridFit(type, areaX, areaY, areaW, areaH, cols, rows, gap, halign='center', valign='top') {
  const ar = AR[type];
  // Try fitting cells by width first
  let cw = (areaW - (cols - 1) * gap) / cols;
  let ch = cw / ar;
  if (rows * ch + (rows - 1) * gap > areaH) {
    // Doesn't fit by width — refit by height
    ch = (areaH - (rows - 1) * gap) / rows;
    cw = ch * ar;
  }
  const blockW = cols * cw + (cols - 1) * gap;
  const blockH = rows * ch + (rows - 1) * gap;
  const xs = halign === 'center' ? areaX + (areaW - blockW) / 2
           : halign === 'right'  ? areaX + areaW - blockW
           : areaX;
  const ys = valign === 'center' ? areaY + (areaH - blockH) / 2
           : valign === 'bottom' ? areaY + areaH - blockH
           : areaY;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        type,
        x: Math.round(xs + c * (cw + gap)),
        y: Math.round(ys + r * (ch + gap)),
        w: Math.round(cw),
        h: Math.round(ch),
      });
    }
  }
  return { cells, used: { x: xs, y: ys, w: blockW, h: blockH } };
}

// ── A FAMILY (portrait hero) ─────────────────────────────────────────
// Strategy: right strip holds 4 cells (mostly small), bottom holds 4 cells (larger).
// As L count increases, P cells migrate out of bottom (replaced by Ls), then out of strip.

function A_strip_4P()  { return gridFit('P', A_STRIP.x, A_STRIP.y, A_STRIP.w, A_STRIP.h, 2, 2, GAP, 'center', 'center').cells; }
function A_strip_3P1L(){
  const top  = gridFit('P', A_STRIP.x, A_STRIP.y,       A_STRIP.w, 220, 3, 1, GAP, 'center', 'top').cells;
  const bot  = gridFit('L', A_STRIP.x, A_STRIP.y + 240, A_STRIP.w, A_STRIP.h - 240, 1, 1, GAP, 'center', 'center').cells;
  return [...top, ...bot];
}
function A_strip_2P2L(){
  const top  = gridFit('P', A_STRIP.x, A_STRIP.y,       A_STRIP.w, 250, 2, 1, GAP, 'center', 'top').cells;
  const bot  = gridFit('L', A_STRIP.x, A_STRIP.y + 270, A_STRIP.w, A_STRIP.h - 270, 2, 1, GAP, 'center', 'top').cells;
  return [...top, ...bot];
}
function A_strip_1P3L(){
  const top  = gridFit('P', A_STRIP.x, A_STRIP.y,       A_STRIP.w, 240, 1, 1, GAP, 'center', 'top').cells;
  const bot  = gridFit('L', A_STRIP.x, A_STRIP.y + 260, A_STRIP.w, A_STRIP.h - 260, 1, 3, GAP, 'center', 'top').cells;
  return [...top, ...bot];
}
function A_strip_4L() {
  return gridFit('L', A_STRIP.x, A_STRIP.y, A_STRIP.w, A_STRIP.h, 2, 2, GAP, 'center', 'center').cells;
}

function A_below_4P()  { return gridFit('P', A_BELOW.x, A_BELOW.y, A_BELOW.w, A_BELOW.h, 4, 1, GAP, 'center', 'top').cells; }
function A_below_3P1L(){
  // Row 1: 3 P cells (4-row width). Row 2: 1 L centered.
  const r1 = gridFit('P', A_BELOW.x, A_BELOW.y,        A_BELOW.w, 320, 3, 1, GAP, 'center', 'top').cells;
  const r2y = A_BELOW.y + 320 + GAP;
  const r2  = gridFit('L', A_BELOW.x, r2y, A_BELOW.w, A_BELOW.y + A_BELOW.h - r2y, 1, 1, GAP, 'center', 'center').cells;
  return [...r1, ...r2];
}
function A_below_2P2L(){
  // Row 1: 2 P cells. Row 2: 2 L cells.
  const r1 = gridFit('P', A_BELOW.x, A_BELOW.y, A_BELOW.w, 290, 2, 1, GAP, 'center', 'top').cells;
  const r2y = A_BELOW.y + 290 + GAP;
  const r2  = gridFit('L', A_BELOW.x, r2y, A_BELOW.w, A_BELOW.y + A_BELOW.h - r2y, 2, 1, GAP, 'center', 'top').cells;
  return [...r1, ...r2];
}
function A_below_1P3L(){
  // Row 1: 1 P + part of L. Actually simpler: row 1 = 3 L cells; row 2 = 1 P centered.
  const r1 = gridFit('L', A_BELOW.x, A_BELOW.y, A_BELOW.w, 220, 3, 1, GAP, 'center', 'top').cells;
  const r2y = A_BELOW.y + 220 + GAP;
  const r2  = gridFit('P', A_BELOW.x, r2y, A_BELOW.w, A_BELOW.y + A_BELOW.h - r2y, 1, 1, GAP, 'center', 'center').cells;
  return [...r1, ...r2];
}
function A_below_4L() {
  return gridFit('L', A_BELOW.x, A_BELOW.y, A_BELOW.w, A_BELOW.h, 2, 2, GAP, 'center', 'center').cells;
}

const A_LAYOUTS = {
  A1: [...A_strip_4P(),  ...A_below_4P()],   // 8P+0L
  A2: [...A_strip_4P(),  ...A_below_3P1L()], // 7P+1L
  A3: [...A_strip_4P(),  ...A_below_2P2L()], // 6P+2L
  A4: [...A_strip_4P(),  ...A_below_1P3L()], // 5P+3L
  A5: [...A_strip_4P(),  ...A_below_4L()],   // 4P+4L
  A6: [...A_strip_3P1L(),...A_below_4L()],   // 3P+5L
  A7: [...A_strip_2P2L(),...A_below_4L()],   // 2P+6L
  A8: [...A_strip_1P3L(),...A_below_4L()],   // 1P+7L
  A9: [...A_strip_4L(),  ...A_below_4L()],   // 0P+8L
};

// ── B FAMILY (landscape hero) ────────────────────────────────────────
// Strategy: hero spans top; 8 cells fill below in two horizontal bands.
// Top band = 4 cells (smaller); bottom band = 4 cells (larger).

const B_TOP   = { x: 30, y: 480, w: 729, h: 290 };
const B_BOT   = { x: 30, y: 780, w: 729, h: 390 };

function B_top_4P()  { return gridFit('P', B_TOP.x, B_TOP.y, B_TOP.w, B_TOP.h, 4, 1, GAP, 'center', 'top').cells; }
function B_top_3P1L(){
  // 3 P cells centered + 1 L cell on right. Use single row.
  const r = gridFit('P', B_TOP.x, B_TOP.y, B_TOP.w * 0.55, B_TOP.h, 3, 1, GAP, 'left', 'top').cells;
  const lW = (r[0].h) * AR.L;
  const lx = B_TOP.x + B_TOP.w - lW;
  const ly = B_TOP.y + (B_TOP.h - r[0].h) / 2;
  r.push({ type: 'L', x: Math.round(lx), y: Math.round(ly), w: Math.round(lW), h: r[0].h });
  return r;
}
function B_top_2P2L(){
  // 2 P left + 2 L right, single row.
  const ps = gridFit('P', B_TOP.x, B_TOP.y, B_TOP.w * 0.42, B_TOP.h, 2, 1, GAP, 'left', 'top').cells;
  const ph = ps[0].h;
  const ls = gridFit('L', B_TOP.x + B_TOP.w - 2 * (ph * AR.L) - GAP, B_TOP.y, 2 * (ph * AR.L) + GAP, ph, 2, 1, GAP, 'left', 'top').cells;
  return [...ps, ...ls];
}
function B_top_1P3L(){
  // 1 P left + 3 L right.
  const p = gridFit('P', B_TOP.x, B_TOP.y, B_TOP.w * 0.25, B_TOP.h, 1, 1, GAP, 'left', 'top').cells;
  const ph = p[0].h;
  const ls = gridFit('L', B_TOP.x + p[0].w + GAP, B_TOP.y, B_TOP.w - p[0].w - GAP, ph, 3, 1, GAP, 'left', 'top').cells;
  return [...p, ...ls];
}
function B_top_4L() { return gridFit('L', B_TOP.x, B_TOP.y, B_TOP.w, B_TOP.h, 4, 1, GAP, 'center', 'top').cells; }

function B_bot_4P() { return gridFit('P', B_BOT.x, B_BOT.y, B_BOT.w, B_BOT.h, 4, 1, GAP, 'center', 'top').cells; }
function B_bot_3P1L(){
  const r1 = gridFit('P', B_BOT.x, B_BOT.y, B_BOT.w, 290, 3, 1, GAP, 'center', 'top').cells;
  const r2y = B_BOT.y + 290 + GAP;
  const r2 = gridFit('L', B_BOT.x, r2y, B_BOT.w, B_BOT.y + B_BOT.h - r2y, 1, 1, GAP, 'center', 'top').cells;
  return [...r1, ...r2];
}
function B_bot_2P2L(){
  const r1 = gridFit('P', B_BOT.x, B_BOT.y, B_BOT.w, 240, 2, 1, GAP, 'center', 'top').cells;
  const r2y = B_BOT.y + 240 + GAP;
  const r2 = gridFit('L', B_BOT.x, r2y, B_BOT.w, B_BOT.y + B_BOT.h - r2y, 2, 1, GAP, 'center', 'top').cells;
  return [...r1, ...r2];
}
function B_bot_1P3L(){
  const r1 = gridFit('L', B_BOT.x, B_BOT.y, B_BOT.w, 180, 3, 1, GAP, 'center', 'top').cells;
  const r2y = B_BOT.y + 180 + GAP;
  const r2 = gridFit('P', B_BOT.x, r2y, B_BOT.w, B_BOT.y + B_BOT.h - r2y, 1, 1, GAP, 'center', 'top').cells;
  return [...r1, ...r2];
}
function B_bot_4L(){ return gridFit('L', B_BOT.x, B_BOT.y, B_BOT.w, B_BOT.h, 2, 2, GAP, 'center', 'center').cells; }

const B_LAYOUTS = {
  B1: [...B_top_4P(),   ...B_bot_4P()],   // 8P+0L
  B2: [...B_top_4P(),   ...B_bot_3P1L()], // 7P+1L
  B3: [...B_top_4P(),   ...B_bot_2P2L()], // 6P+2L
  B4: [...B_top_4P(),   ...B_bot_1P3L()], // 5P+3L
  B5: [...B_top_4P(),   ...B_bot_4L()],   // 4P+4L
  B6: [...B_top_3P1L(), ...B_bot_4L()],   // 3P+5L
  B7: [...B_top_2P2L(), ...B_bot_4L()],   // 2P+6L
  B8: [...B_top_1P3L(), ...B_bot_4L()],   // 1P+7L
  B9: [...B_top_4L(),   ...B_bot_4L()],   // 0P+8L
};

// ── RENDER ────────────────────────────────────────────────────────────

function labelCells(cells) {
  // Assign labels P1..PN, L1..LN in the order they appear in the cells array.
  let pIdx = 0, lIdx = 0;
  return cells.map(c => {
    if (c.type === 'P') return { ...c, label: 'P' + (++pIdx) };
    return { ...c, label: 'L' + (++lIdx) };
  });
}

function drawHero(ctx, fam) {
  const h = HEROES[fam];
  // Shadow
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(h.x + 4, h.y + 4, h.w, h.h);
  // Fill + gold border
  ctx.fillStyle = COL.heroFill;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.strokeStyle = COL.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(h.x + 1.5, h.y + 1.5, h.w - 3, h.h - 3);
  // Label
  ctx.fillStyle = COL.gold;
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HERO', h.x + h.w / 2, h.y + h.h / 2 - 18);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = COL.goldDim;
  ctx.fillText(`(${h.kind} — LOCKED)`, h.x + h.w / 2, h.y + h.h / 2 + 6);
  ctx.font = '11px monospace';
  ctx.fillText(`${h.w}×${h.h}  AR ${(h.w / h.h).toFixed(2)}`, h.x + h.w / 2, h.y + h.h / 2 + 24);
}

function drawCell(ctx, c) {
  // Soft shadow
  ctx.fillStyle = COL.shadow;
  ctx.fillRect(c.x + 3, c.y + 3, c.w, c.h);
  // Fill by orientation
  ctx.fillStyle = c.type === 'P' ? COL.portrait : c.type === 'L' ? COL.landscape : COL.square;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  // Thin border
  ctx.strokeStyle = 'rgba(12,14,20,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  // Label
  ctx.fillStyle = 'rgba(12,14,20,0.92)';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2);
  // Sub-label: dimensions
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(12,14,20,0.55)';
  ctx.fillText(`${c.w}×${c.h}`, c.x + c.w / 2, c.y + c.h / 2 + 18);
}

function drawHeader(ctx, id, pCount, lCount) {
  // Top label bar
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, W, 50);
  ctx.fillStyle = COL.ivory;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(id, 20, 14);
  ctx.font = '14px monospace';
  ctx.fillStyle = COL.ivoryDim;
  ctx.fillText(`Hero ${id[0] === 'A' ? 'portrait/square' : 'landscape'} · ${pCount} Portrait + ${lCount} Landscape supporting`, 60, 18);
  // Gold accent line
  ctx.strokeStyle = COL.gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 47);
  ctx.lineTo(W - 20, 47);
  ctx.stroke();
}

function renderLayout(id, fam, cells) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, W, H);
  // Subtle gold inner frame (CelebrateBanner aesthetic)
  ctx.strokeStyle = COL.goldDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  const labeled = labelCells(cells);
  const pCount = labeled.filter(c => c.type === 'P').length;
  const lCount = labeled.filter(c => c.type === 'L').length;
  drawHeader(ctx, id, pCount, lCount);
  drawHero(ctx, fam);
  for (const c of labeled) drawCell(ctx, c);
  return canvas;
}

// ── CONTACT SHEET ────────────────────────────────────────────────────

function renderContactSheet(family, layouts) {
  const cols = 3, rows = 3;
  const pad = 24, titleH = 70;
  const cellW = W / 2, cellH = H / 2; // half-size thumbnails
  const sheetW = cols * cellW + (cols + 1) * pad;
  const sheetH = titleH + rows * cellH + (rows + 1) * pad;
  const canvas = createCanvas(sheetW, sheetH);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, sheetW, sheetH);
  ctx.fillStyle = COL.ivory;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Tabletop v2 — Family ${family} (${family === 'A' ? 'Portrait/Square Hero' : 'Landscape Hero'})`, pad, 18);
  ctx.font = '14px monospace';
  ctx.fillStyle = COL.ivoryDim;
  ctx.fillText('Arrangement number = number of landscape supporting photos (0..8)', pad, 50);
  const ids = Object.keys(layouts);
  ids.forEach((id, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const x = pad + c * (cellW + pad);
    const y = titleH + pad + r * (cellH + pad);
    const tile = renderLayout(id, family, layouts[id]);
    ctx.drawImage(tile, x, y, cellW, cellH);
    ctx.strokeStyle = COL.goldDim;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellW, cellH);
  });
  return canvas;
}

// ── MAIN ─────────────────────────────────────────────────────────────

const outDir = '/tmp/tabletop_v2_preview';
const allLayouts = { ...A_LAYOUTS, ...B_LAYOUTS };
const summary = [];

for (const [id, cells] of Object.entries(allLayouts)) {
  const fam = id[0];
  const canvas = renderLayout(id, fam, cells);
  const filename = `tabletop_v2_${id}.png`;
  fs.writeFileSync(path.join(outDir, filename), canvas.toBuffer('image/png'));
  const labeled = labelCells(cells);
  const pCount = labeled.filter(c => c.type === 'P').length;
  const lCount = labeled.filter(c => c.type === 'L').length;
  summary.push({ id, fam, pCount, lCount, total: cells.length, filename });
}

// Contact sheets
const sheetA = renderContactSheet('A', A_LAYOUTS);
fs.writeFileSync(path.join(outDir, 'tabletop_v2_contact_A.png'), sheetA.toBuffer('image/png'));
const sheetB = renderContactSheet('B', B_LAYOUTS);
fs.writeFileSync(path.join(outDir, 'tabletop_v2_contact_B.png'), sheetB.toBuffer('image/png'));

// Print summary
console.log('\n┌────┬────────┬───┬───┬───────┐');
console.log('│ ID │ Family │ P │ L │ Total │');
console.log('├────┼────────┼───┼───┼───────┤');
for (const s of summary) {
  console.log(`│ ${s.id} │   ${s.fam}    │ ${s.pCount} │ ${s.lCount} │   ${s.total}   │`);
}
console.log('└────┴────────┴───┴───┴───────┘');
console.log(`\n✓ Wrote ${summary.length} layout PNGs + 2 contact sheets to ${outDir}`);
