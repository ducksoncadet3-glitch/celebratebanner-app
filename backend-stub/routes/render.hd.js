/**
 * POST /api/render/hd
 *
 * Triggers an HD render for a project. The render runs through the queue so
 * concurrent HD jobs don't blow up memory. Returns a jobId immediately;
 * /api/projects/:id/status polls until status === 'done'.
 *
 * This route is typically invoked by the Stripe webhook (after a successful
 * payment marks the project paid), but it's exposed for retry/regenerate.
 */

const { enqueue, status } = require('../services/render-queue');
const { renderBannerHD, renderStandMockupBuffer } = require('../services/render');

async function hdRenderHandler(req, res) {
  try {
    const input = req.body;
    if (!input || !input.projectId) {
      return res.status(400).json({ error: 'projectId required' });
    }

    // Kick off async — return the jobId right away.
    enqueue(async (progress) => {
      progress(5);
      const banner = await renderBannerHD(input, input.exportOptions);
      progress(70);
      const standMockup = await renderStandMockupBuffer(banner.png);
      progress(95);
      // TODO: upload banner.png / banner.jpeg / standMockup to S3/Cloudinary
      // and write the URLs into the project record. See services/projects.js
      // for the persistence hook (`generateSignedDownloads`).
      return { dimensions: banner.dimensions, mockupBytes: standMockup.length };
    }).catch((err) => {
      console.error('[hd] render failed', err);
    });

    // We don't await — return the jobId / status snapshot immediately.
    res.status(202).json({ ok: true, projectId: input.projectId });
  } catch (err) {
    console.error('[hd] route failed', err);
    res.status(500).json({ error: err.message });
  }
}

function hdStatusHandler(req, res) {
  const job = status(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'not found' });
  res.status(200).json(job);
}

module.exports = { hdRenderHandler, hdStatusHandler };
