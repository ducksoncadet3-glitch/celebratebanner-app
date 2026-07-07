/**
 * Validator — the quality gate on a rendered result. A RenderedConcept passes only
 * when the render completed, a preview and thumbnail exist, every export target was
 * produced, and the upstream plan itself was accepted. Deterministic.
 */
import type {
  RenderPlan, RenderedImage, RenderedExportTarget, RenderStatus, RenderQualityChecks,
} from './types.ts';
import { REQUIRED_EXPORT_TARGETS } from './types.ts';

/** An image handle is valid when it references real output with positive size. */
export function imageValid(img: RenderedImage | null | undefined): boolean {
  return !!img
    && typeof img.uri === 'string' && img.uri.length > 0
    && img.widthPx > 0 && img.heightPx > 0
    && img.byteSize > 0;
}

function exportsAvailable(plan: RenderPlan, rendered: RenderedExportTarget[]): boolean {
  if (!Array.isArray(rendered) || rendered.length !== plan.exportTargets.length) return false;
  const ids = new Set(rendered.map((t) => t.id));
  const allRequired = REQUIRED_EXPORT_TARGETS.every((id) => ids.has(id));
  const allImaged = rendered.every((t) => imageValid(t.image));
  return allRequired && allImaged;
}

export function validateRendered(
  plan: RenderPlan,
  previewImage: RenderedImage | null,
  thumbnailImage: RenderedImage | null,
  exportTargets: RenderedExportTarget[],
  status: RenderStatus,
): RenderQualityChecks {
  const reasons: string[] = [];

  const renderCompleted = status === 'completed';
  const previewExists = imageValid(previewImage);
  const thumbnailExists = imageValid(thumbnailImage);
  const exportTargetsAvailable = exportsAvailable(plan, exportTargets);
  const qualityChecksPassed = plan.accepted === true && plan.qualityChecks.passed === true;

  if (!qualityChecksPassed) {
    // A rejected plan is never rendered — surface why so the caller can act.
    const upstream = plan.qualityChecks.reasons;
    reasons.push(upstream.length
      ? `Render plan was not accepted: ${upstream.join(' ')}`
      : 'Render plan was not accepted by the orchestrator.');
  }
  if (!renderCompleted) reasons.push(`Render did not complete (status: ${status}).`);
  if (!previewExists) reasons.push('Preview image was not produced.');
  if (!thumbnailExists) reasons.push('Thumbnail image was not produced.');
  if (!exportTargetsAvailable) reasons.push('Export targets were not fully rendered.');

  const passed = renderCompleted && previewExists && thumbnailExists
    && exportTargetsAvailable && qualityChecksPassed;

  return {
    passed, renderCompleted, previewExists, thumbnailExists,
    exportTargetsAvailable, qualityChecksPassed, reasons,
  };
}
