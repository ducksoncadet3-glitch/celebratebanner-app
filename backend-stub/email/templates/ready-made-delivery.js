/**
 * Delivery email for a READY-MADE order.
 *
 * A ready-made product is finished artwork sold exactly as shown — nothing is rendered
 * after purchase, so the personalized template's "we've finished rendering your
 * CelebrateBanner" is simply untrue here. Same secure expiring link, same cross-sell,
 * accurate words.
 *
 * The product name is supplied by the ready-made registry, never hard-coded, so a second
 * ready-made product needs no new template.
 */

module.exports = function readyMadeDeliveryTemplate({ productName, links, name }) {
  const product = escapeHtml(productName || 'Your CelebrateBanner artwork');
  const greet = name ? `Hi ${escapeHtml(name)}, ` : '';
  const expires = new Date(links.expiresAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const subject = 'Your CelebrateBanner artwork is ready 🎉';

  const cta = (label, href, primary) => `
    <a href="${href}" style="display:inline-block;background:${primary ? '#0C0E14' : '#FAF8F3'};color:${primary ? '#E8C97A' : '#0C0E14'};padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-family:'Outfit',Arial,sans-serif;font-size:14px;${primary ? '' : 'border:1px solid #C9A84C;'}margin:6px 4px;">${label}</a>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:Georgia,serif;color:#0C0E14;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;margin:0 0 12px;">Your artwork is ready.</h1>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;line-height:1.55;color:#3a3d44;">
      ${greet}Thank you for your purchase. <strong>${product}</strong> is ready to download.
    </p>
    <div style="margin:24px 0;">
      ${cta('⬇ Download Your Artwork', links.downloadUrl, true)}
    </div>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;line-height:1.5;color:#7a7d84;">
      This private download link expires <strong>${expires}</strong>. Save the file to your device.
    </p>
    <hr style="border:none;border-top:1px solid #e5e0d3;margin:32px 0;">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;line-height:1.55;color:#3a3d44;margin:0 0 12px;">
      Looking for your next keepsake?
    </p>
    <div style="margin:0 0 24px;">
      ${cta('Discover More CelebrateBanner Designs', 'https://www.celebratebanner.com/', false)}
    </div>
    <hr style="border:none;border-top:1px solid #e5e0d3;margin:32px 0;">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;line-height:1.5;color:#a7aab1;">
      CDN4 LLC dba CelebrateBanner · 211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401<br>
      Questions? Reply to this email or contact <a href="mailto:info@celebratebanner.com" style="color:#a7aab1;">info@celebratebanner.com</a>.
    </p>
  </div>
</body></html>`;

  const text = [
    'Your artwork is ready.',
    '',
    `Thank you for your purchase. ${productName || 'Your CelebrateBanner artwork'} is ready to download.`,
    '',
    `Download your artwork: ${links.downloadUrl}`,
    '',
    `This private link expires ${expires}. Save the file to your device.`,
    '',
    'Discover more CelebrateBanner designs: https://www.celebratebanner.com/',
  ].join('\n');

  return { subject, html, text };
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
