// Tabletop v2 — 9-photo layout investigation v2.
// Revised layout engine: row-major dedicated rows that fill the collage area exactly.
// Each row's height + cell widths are pre-computed so:
//   - Row width = innerW (no horizontal gaps)
//   - Sum of row heights + gaps = areaH (no vertical gaps)
//   - Portrait cells stay portrait (aspect < 1), landscape cells stay landscape (aspect > 1)
//   - No tiny cells (target min 100px on shortest side)

const { createCanvas } = require('./node_modules/canvas');
const fs = require('fs');
const path = require('path');

const W = 789, H = 1200;
const GAP = 10;
const MARGIN_OUT = 30;          // outer canvas margin

// CelebrateBanner palette
const COL = {
  bg:        '#0C0E14',
  gold:      '#C9A84C',
  goldDim:   'rgba(201,168,76,0.35)',
  goldFaint: 'rgba(201,168,76,0.18)',
  ivory:     '#FAF8F3',
  ivoryDim:  'rgba(250,248,243,0.55)',
  portrait:  '#C9A84C',
  landscape: '#4A9ECC',
  heroFill:  '#1A1612',
  textFill:  'rgba(26,22,18,0.65)',
  shadow:    'rgba(0,0,0,0.55)',
};

// ── REGIONS ──────────────────────────────────────────────────────────────
// Family A: portrait/square hero LEFT + side-text column RIGHT + 8 cells BELOW.
// Family B: landscape hero spans top + 8 cells BELOW.

const HEROES = {
  A: { x: MARGIN_OUT, y: 60,  w: 380, h: 507, kind: 'portrait/square' },
  B: { x: MARGIN_OUT, y: 60,  w: 729, h: 400, kind: 'landscape' },
};

// Right-of-hero text area for Family A only.
const A_TEXT  = { x: 420, y: 60,  w: 339, h: 507 };

// Collage area (where the 8 supporting cells go).
const A_COLLAGE = { x: MARGIN_OUT, y: 587, w: 729, h: 583 };  // 1170 - 587 = 583
const B_COLLAGE = { x: MARGIN_OUT, y: 480, w: 729, h: 690 };  // 1170 - 480 = 690

// ── ROW-BASED LAYOUT ENGINE ──────────────────────────────────────────────
// Each layout = ordered list of rows. Each row = {h, cells: [type, type, ...]}.
// Row heights chosen so sum + gaps = area.h exactly.
// Row cell widths derived from cell type aspect (P=0.75, L=1.333) at row height,
// then scaled uniformly so total = area.w exactly (scale should be very close to 1
// because heights were chosen to make natural widths fit).

const ASPECT = { P: 0.75, L: 4/3 };

function placeRow(row, areaX, y, areaW, gap) {
  // Natural cell widths at the row's height
  const widths = row.cells.map(t => ASPECT[t] * row.h);
  const totalGaps = (row.cells.length - 1) * gap;
  const naturalW = widths.reduce((a, b) => a + b, 0);
  const scale = (areaW - totalGaps) / naturalW;
  // Place cells left-to-right
  const cells = [];
  let x = areaX;
  for (let i = 0; i < row.cells.length; i++) {
    const cw = widths[i] * scale;
    cells.push({ type: row.cells[i], x: Math.round(x), y: Math.round(y), w: Math.round(cw), h: Math.round(row.h) });
    x += cw + gap;
  }
  return cells;
}

function placeLayout(rows, area, gap) {
  const totalRowH = rows.reduce((s, r) => s + r.h, 0) + gap * (rows.length - 1);
  // Vertical scale (should be ≈ 1 if we designed heights right)
  const vScale = area.h / totalRowH;
  let y = area.y;
  const cells = [];
  for (const row of rows) {
    const scaledH = row.h * vScale;
    cells.push(...placeRow({ ...row, h: scaledH }, area.x, y, area.w, gap));
    y += scaledH + gap;
  }
  return cells;
}

// ── LAYOUT DEFINITIONS — A FAMILY (collage 729×583) ──────────────────────
// Row heights designed so sum + gaps ≈ 583.
const A_ROWS = {
  A1: [ // 8P · 2 rows × 4P
    { h: 285, cells: ['P','P','P','P'] },
    { h: 285, cells: ['P','P','P','P'] },
  ],
  A2: [ // 7P+1L · top 5P narrow tall + bottom 2P+1L mixed
    { h: 295, cells: ['P','P','P','P','P'] },
    { h: 277, cells: ['P','P','L'] },
  ],
  A3: [ // 6P+2L · top 4P + bottom 2P+2L
    { h: 405, cells: ['P','P','P','P'] },
    { h: 168, cells: ['P','P','L','L'] },
  ],
  A4: [ // 5P+3L · top 5P + bottom 3L
    { h: 410, cells: ['P','P','P','P','P'] },
    { h: 163, cells: ['L','L','L'] },
  ],
  A5: [ // 4P+4L · top 4P + middle 2L + bottom 2L
    { h: 230, cells: ['P','P','P','P'] },
    { h: 161, cells: ['L','L'] },
    { h: 162, cells: ['L','L'] },
  ],
  A6: [ // 3P+5L · 3P top + 2L mid + 3L bottom
    { h: 280, cells: ['P','P','P'] },
    { h: 175, cells: ['L','L'] },
    { h: 108, cells: ['L','L','L'] },
  ],
  A7: [ // 2P+6L · mixed top + 2L + 2L
    { h: 170, cells: ['P','P','L','L'] },
    { h: 196, cells: ['L','L'] },
    { h: 197, cells: ['L','L'] },
  ],
  A8: [ // 1P+7L · big mixed top (1P+1L) + 4L mid + 2L bottom
    { h: 345, cells: ['P','L'] },
    { h: 115, cells: ['L','L','L','L'] },
    { h: 103, cells: ['L','L'] },
  ],
  A9: [ // 8L · 4 rows × 2L
    { h: 138, cells: ['L','L'] },
    { h: 138, cells: ['L','L'] },
    { h: 138, cells: ['L','L'] },
    { h: 139, cells: ['L','L'] },
  ],
};

// ── LAYOUT DEFINITIONS — B FAMILY (collage 729×690) ──────────────────────
const B_ROWS = {
  B1: [ // 8P · 2 rows × 4P
    { h: 340, cells: ['P','P','P','P'] },
    { h: 340, cells: ['P','P','P','P'] },
  ],
  B2: [ // 7P+1L · 4P + 3P + 1L
    { h: 260, cells: ['P','P','P','P'] },
    { h: 290, cells: ['P','P','P'] },
    { h: 120, cells: ['L'] },
  ],
  B3: [ // 6P+2L · 6P + 2L
    { h: 410, cells: ['P','P','P','P','P','P'] },
    { h: 270, cells: ['L','L'] },
  ],
  B4: [ // 5P+3L · 5P top + 3L bottom
    { h: 485, cells: ['P','P','P','P','P'] },
    { h: 195, cells: ['L','L','L'] },
  ],
  B5: [ // 4P+4L · 4P + 2L + 2L
    { h: 305, cells: ['P','P','P','P'] },
    { h: 182, cells: ['L','L'] },
    { h: 183, cells: ['L','L'] },
  ],
  B6: [ // 3P+5L · 3P + 2L + 3L
    { h: 290, cells: ['P','P','P'] },
    { h: 200, cells: ['L','L'] },
    { h: 180, cells: ['L','L','L'] },
  ],
  B7: [ // 2P+6L · mixed + 2L + 2L
    { h: 170, cells: ['P','P','L','L'] },
    { h: 245, cells: ['L','L'] },
    { h: 245, cells: ['L','L'] },
  ],
  B8: [ // 1P+7L · big mixed + 3L + 3L
    { h: 350, cells: ['P','L'] },
    { h: 160, cells: ['L','L','L'] },
    { h: 160, cells: ['L','L','L'] },
  ],
  B9: [ // 8L · 4 rows × 2L
    { h: 162, cells: ['L','L'] },
    { h: 162, cells: ['L','L'] },
    { h: 163, cells: ['L','L'] },
    { h: 163, cells: ['L','L'] },
  ],
};

// ── DRAWING ──────────────────────────────────────────────────────────────

function drawHero(ctx, fam) {
  const h = HEROES[fam];
  ctx.fillStyle = COL.shadow; ctx.fillRect(h.x + 4, h.y + 4, h.w, h.h);
  ctx.fillStyle = COL.heroFill; ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.strokeStyle = COL.gold; ctx.lineWidth = 3;
  ctx.strokeRect(h.x + 1.5, h.y + 1.5, h.w - 3, h.h - 3);
  ctx.fillStyle = COL.gold;
  ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('HERO', h.x + h.w / 2, h.y + h.h / 2 - 18);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = COL.goldDim;
  ctx.fillText(`(${h.kind} — LOCKED)`, h.x + h.w / 2, h.y + h.h / 2 + 8);
  ctx.font = '11px monospace';
  ctx.fillText(`${h.w}×${h.h}  AR ${(h.w / h.h).toFixed(2)}`, h.x + h.w / 2, h.y + h.h / 2 + 26);
}

function drawTextArea(ctx) {
  // Family A only — right-of-hero text area sketch.
  const t = A_TEXT;
  ctx.strokeStyle = COL.goldFaint; ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(t.x, t.y, t.w, t.h);
  ctx.setLineDash([]);
  ctx.fillStyle = COL.ivory;
  ctx.font = 'italic 32px "Cormorant Garamond", serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('Your Name', t.x + 14, t.y + 24);
  ctx.font = '20px "Cormorant Garamond", serif'; ctx.fillStyle = COL.gold;
  ctx.fillText('Class of 2026', t.x + 14, t.y + 64);
  ctx.font = '14px Outfit, sans-serif'; ctx.fillStyle = COL.ivoryDim;
  ctx.fillText('West Palm Beach, FL', t.x + 14, t.y + 92);
  ctx.font = 'bold 9px monospace'; ctx.fillStyle = COL.goldFaint;
  ctx.fillText('TEXT AREA', t.x + 14, t.y + t.h - 22);
}

function drawCell(ctx, c) {
  ctx.fillStyle = COL.shadow; ctx.fillRect(c.x + 3, c.y + 3, c.w, c.h);
  ctx.fillStyle = c.type === 'P' ? COL.portrait : COL.landscape;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = 'rgba(12,14,20,0.4)'; ctx.lineWidth = 1;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = 'rgba(12,14,20,0.92)';
  // Label sized roughly to cell
  const lblSize = Math.max(12, Math.min(22, Math.min(c.w, c.h) / 6));
  ctx.font = `bold ${Math.round(lblSize)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 - 4);
  ctx.font = `${Math.round(lblSize * 0.55)}px monospace`;
  ctx.fillStyle = 'rgba(12,14,20,0.55)';
  ctx.fillText(`${c.w}×${c.h}`, c.x + c.w / 2, c.y + c.h / 2 + lblSize * 0.7);
}

function labelCells(cells) {
  let p = 0, l = 0;
  return cells.map(c => c.type === 'P'
    ? { ...c, label: 'P' + (++p) }
    : { ...c, label: 'L' + (++l) });
}

function drawHeader(ctx, id, pCount, lCount) {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, 50);
  ctx.fillStyle = COL.ivory;
  ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(id, 20, 14);
  ctx.font = '14px monospace'; ctx.fillStyle = COL.ivoryDim;
  ctx.fillText(`Hero ${id[0] === 'A' ? 'portrait/square' : 'landscape'} · ${pCount} Portrait + ${lCount} Landscape supporting`, 60, 18);
  ctx.strokeStyle = COL.gold; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, 47); ctx.lineTo(W - 20, 47); ctx.stroke();
}

function renderLayout(id, fam, rows) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = COL.goldDim; ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  const area = fam === 'A' ? A_COLLAGE : B_COLLAGE;
  const cells = labelCells(placeLayout(rows, area, GAP));
  const pCount = cells.filter(c => c.type === 'P').length;
  const lCount = cells.filter(c => c.type === 'L').length;
  drawHeader(ctx, id, pCount, lCount);
  drawHero(ctx, fam);
  if (fam === 'A') drawTextArea(ctx);
  for (const c of cells) drawCell(ctx, c);
  return canvas;
}

function renderContactSheet(family, layouts) {
  const cols = 3, rows = 3;
  const pad = 24, titleH = 70;
  const cellW = W / 2, cellH = H / 2;
  const sheetW = cols * cellW + (cols + 1) * pad;
  const sheetH = titleH + rows * cellH + (rows + 1) * pad;
  const canvas = createCanvas(sheetW, sheetH);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, sheetW, sheetH);
  ctx.fillStyle = COL.ivory;
  ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`Tabletop v2 — Family ${family} (${family === 'A' ? 'Portrait/Square Hero' : 'Landscape Hero'}) · v2 full-fill`, pad, 18);
  ctx.font = '14px monospace'; ctx.fillStyle = COL.ivoryDim;
  ctx.fillText('Arrangement number = number of landscape supporting photos (0..8)', pad, 50);
  const ids = Object.keys(layouts);
  ids.forEach((id, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const x = pad + c * (cellW + pad);
    const y = titleH + pad + r * (cellH + pad);
    const tile = renderLayout(id, family, layouts[id]);
    ctx.drawImage(tile, x, y, cellW, cellH);
    ctx.strokeStyle = COL.goldDim; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellW, cellH);
  });
  return canvas;
}

// ── MAIN ─────────────────────────────────────────────────────────────────

const outDir = '/tmp/tabletop_v2_preview';

// Render individual layouts
const summary = [];
for (const fam of ['A', 'B']) {
  const layouts = fam === 'A' ? A_ROWS : B_ROWS;
  for (const [id, rows] of Object.entries(layouts)) {
    const canvas = renderLayout(id, fam, rows);
    const filename = `tabletop_v2_${id}_v2.png`;
    fs.writeFileSync(path.join(outDir, filename), canvas.toBuffer('image/png'));
    const area = fam === 'A' ? A_COLLAGE : B_COLLAGE;
    const cells = labelCells(placeLayout(rows, area, GAP));
    const pCount = cells.filter(c => c.type === 'P').length;
    const lCount = cells.filter(c => c.type === 'L').length;
    // Compute area fill stat
    const cellAreaSum = cells.reduce((s, c) => s + c.w * c.h, 0);
    const totalArea = area.w * area.h;
    const fillPct = (cellAreaSum / totalArea * 100).toFixed(1);
    summary.push({ id, fam, pCount, lCount, total: cells.length, fillPct, rowCount: rows.length });
  }
}

// Contact sheets
const sheetA = renderContactSheet('A', A_ROWS);
fs.writeFileSync(path.join(outDir, 'tabletop_v2_contact_A_v2.png'), sheetA.toBuffer('image/png'));
const sheetB = renderContactSheet('B', B_ROWS);
fs.writeFileSync(path.join(outDir, 'tabletop_v2_contact_B_v2.png'), sheetB.toBuffer('image/png'));

// Print summary
console.log('\n┌────┬───┬───┬───────┬──────┬─────────┐');
console.log('│ ID │ P │ L │ Total │ Rows │ Fill %  │');
console.log('├────┼───┼───┼───────┼──────┼─────────┤');
for (const s of summary) {
  console.log(`│ ${s.id} │ ${s.pCount} │ ${s.lCount} │   ${s.total}   │   ${s.rowCount}  │  ${s.fillPct}% │`);
}
console.log('└────┴───┴───┴───────┴──────┴─────────┘');
console.log(`\n✓ Wrote 18 layout PNGs (v2) + 2 contact sheets (v2) to ${outDir}`);
