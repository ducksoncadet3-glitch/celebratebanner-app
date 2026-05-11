import type { CanvasImage, MockupRenderer, RenderTarget } from '../types.js';
import { registerMockup } from './registry.js';

export interface RetractableStandOptions {
  /** Render at this device-pixel-ratio. Default 2. */
  dpr?: number;
  /** Logical width before DPR multiplication. Default 600. */
  width?: number;
  /** Logical height before DPR multiplication. Default 900. */
  height?: number;
}

/**
 * Renders a realistic retractable banner stand around a rendered banner.
 * Ported from renderStandMockup() in index.html.
 */
export const RetractableStandMockup: MockupRenderer<RetractableStandOptions> = {
  id: 'retractable-stand',
  label: 'Retractable banner stand',
  render(target: RenderTarget, banner: CanvasImage, opts?: RetractableStandOptions) {
    const dpr = opts?.dpr ?? 2;
    const W = opts?.width ?? 600;
    const H = opts?.height ?? 900;
    target.width = W * dpr;
    target.height = H * dpr;
    const ctx = target.getContext('2d');
    ctx.scale(dpr, dpr);

    // Studio background
    ctx.fillStyle = '#F8F8F8';
    ctx.fillRect(0, 0, W, H);

    // Layout regions
    const margin = 30;
    const topBarH = Math.round(H * 0.015);
    const banH = Math.round(H * 0.78);
    const baseH = Math.round(banH * 0.06);
    const poleW = Math.max(5, Math.round(W * 0.010));
    const bannerL = margin;
    const bannerR = W - margin;
    const bannerW = bannerR - bannerL;
    const bannerT = margin + topBarH;
    const bannerB = bannerT + banH;

    // 1) Top bar (chrome silver)
    const tb = ctx.createLinearGradient(bannerL, 0, bannerR, 0);
    tb.addColorStop(0, '#E0E0E0');
    tb.addColorStop(0.5, '#FFFFFF');
    tb.addColorStop(1, '#C0C0C0');
    ctx.fillStyle = tb;
    ctx.fillRect(bannerL, margin, bannerW, topBarH);
    ctx.fillStyle = '#7B7F86';
    const capR = topBarH * 0.85;
    ctx.beginPath();
    ctx.arc(bannerL, margin + topBarH / 2, capR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bannerR, margin + topBarH / 2, capR, 0, Math.PI * 2);
    ctx.fill();

    // 2) Banner with vertical taper + clip to trapezoid
    const taper = bannerW * 0.02;
    const topLx = bannerL + taper;
    const topRx = bannerR - taper;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topLx, bannerT);
    ctx.lineTo(topRx, bannerT);
    ctx.lineTo(bannerR, bannerB);
    ctx.lineTo(bannerL, bannerB);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(banner as unknown as CanvasImageSource, bannerL, bannerT, bannerW, banH);
    // Subtle specular highlight
    const spec = ctx.createLinearGradient(bannerL, bannerT, bannerL + bannerW * 0.55, bannerT + banH * 0.5);
    spec.addColorStop(0, 'rgba(255,255,255,0.18)');
    spec.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.fillRect(bannerL, bannerT, bannerW, banH);
    ctx.restore();

    // Thin border on the trapezoid
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topLx, bannerT);
    ctx.lineTo(topRx, bannerT);
    ctx.lineTo(bannerR, bannerB);
    ctx.lineTo(bannerL, bannerB);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 3) Pole (chrome telescoping, taller, centered under banner right edge)
    const poleX = bannerR - poleW / 2;
    const poleTop = margin + topBarH;
    const poleBot = bannerB + baseH * 0.85;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poleX, poleTop);
    ctx.lineTo(poleX + poleW, poleTop);
    ctx.lineTo(poleX + poleW * 1.25, poleBot);
    ctx.lineTo(poleX - poleW * 0.25, poleBot);
    ctx.closePath();
    const pg = ctx.createLinearGradient(poleX - poleW, 0, poleX + poleW * 2, 0);
    pg.addColorStop(0, '#3F4654');
    pg.addColorStop(0.5, '#FFFFFF');
    pg.addColorStop(1, '#9CA3AF');
    ctx.fillStyle = pg;
    ctx.fill();
    // Adjustment knob
    const knobCy = poleTop + (poleBot - poleTop) * 0.5;
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.ellipse(poleX + poleW / 2, knobCy, poleW * 1.6, poleW * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4) Base: brushed aluminum ellipse + contact shadow
    const baseW = Math.round(bannerW * 0.70);
    const baseCx = (bannerL + bannerR) / 2;
    const baseCy = bannerB + baseH;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.filter = 'blur(14px)';
    ctx.beginPath();
    ctx.ellipse(baseCx + 6, baseCy + baseH * 0.6, baseW / 2 + 18, baseH * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    const baseGrad = ctx.createRadialGradient(
      baseCx - baseW * 0.12, baseCy - baseH * 0.5, 4,
      baseCx, baseCy + baseH * 0.2, baseW / 2,
    );
    baseGrad.addColorStop(0, '#FFFFFF');
    baseGrad.addColorStop(0.18, '#E5E7EB');
    baseGrad.addColorStop(0.45, '#9CA3AF');
    baseGrad.addColorStop(0.78, '#4B5563');
    baseGrad.addColorStop(1, '#1F2937');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(baseCx, baseCy, baseW / 2, baseH, 0, 0, Math.PI * 2);
    ctx.fill();
    // Brushed metal streaks
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(baseCx, baseCy, baseW / 2, baseH, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.6;
    for (let yy = baseCy - baseH; yy <= baseCy + baseH; yy += 2) {
      ctx.beginPath();
      ctx.moveTo(baseCx - baseW / 2, yy);
      ctx.lineTo(baseCx + baseW / 2, yy);
      ctx.stroke();
    }
    ctx.restore();

    // Highlight on upper-left of base
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.beginPath();
    ctx.ellipse(baseCx - baseW * 0.18, baseCy - baseH * 0.35, baseW * 0.30, baseH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Floor reflection
    const floorTop = baseCy + baseH;
    const floorH = H - floorTop;
    if (floorH > 6) {
      const fg = ctx.createLinearGradient(0, floorTop, 0, floorTop + floorH);
      fg.addColorStop(0, 'rgba(0,0,0,0.06)');
      fg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, floorTop, W, floorH);
    }
  },
};

registerMockup(RetractableStandMockup);
