/**
 * Order confirmation for a READY-MADE DIGITAL order.
 *
 * The personalized confirmation promises that a banner "is being prepared" and that
 * download links and shipping updates will follow. For finished artwork sold as-is, none of
 * that happens: the download is authorized in the same instant the payment lands, so the
 * confirmation must say so and point at the page that already has the button.
 *
 * Deliberately mentions no rendering, no photo preparation, no shipping and no queue.
 */

const SITE = process.env.PUBLIC_SITE_URL || 'https://celebratebanner.com';

module.exports = function readyMadeConfirmationTemplate({ projectId, productName, sessionId }) {
  const subject = 'Your CelebrateBanner order is confirmed 🎉';
  const product = productName ? escapeHtml(productName) : null;

  // The success page is the customer's self-serve download. Only link it when we can
  // actually authorize the visit — it needs the paid session id to prove ownership.
  const successUrl = projectId && sessionId
    ? `${SITE}/success?session_id=${encodeURIComponent(sessionId)}&project_id=${encodeURIComponent(projectId)}`
    : null;

  const text = [
    'Your order is confirmed.',
    '',
    'Thank you for your purchase. Your payment was received and your artwork is ready for download.',
    productName ? `\nProduct: ${productName}` : null,
    successUrl ? `\nDownload it here: ${successUrl}` : null,
    '\nA separate email with your secure download link is on its way.',
    projectId ? `\nOrder reference: ${projectId}` : null,
    '',
    '— The CelebrateBanner team',
  ].filter(Boolean).join('\n');

  const ref = projectId
    ? `<p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7a7d84;">Order reference: ${escapeHtml(projectId)}</p>`
    : '';

  const cta = successUrl
    ? `<div style="margin:20px 0;"><a href="${successUrl}" style="display:inline-block;background:#0C0E14;color:#E8C97A;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-family:'Outfit',Arial,sans-serif;font-size:14px;">⬇ Download Your Artwork</a></div>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:Georgia,serif;color:#0C0E14;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;margin:0 0 12px;">
      Your order is confirmed.
    </h1>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;line-height:1.55;color:#3a3d44;">
      Thank you for your purchase. Your payment was received and your artwork is ready for download.
    </p>
    ${product ? `<p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;line-height:1.55;color:#3a3d44;"><strong>${product}</strong></p>` : ''}
    ${cta}
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;line-height:1.5;color:#7a7d84;">
      A separate email with your secure download link is on its way.
    </p>
    ${ref}
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7a7d84;">
      &mdash; The CelebrateBanner team
    </p>
  </div>
</body></html>`;

  return { subject, html, text };
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
