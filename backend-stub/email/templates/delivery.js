/**
 * Delivery email — sent the moment an HD render completes.
 *
 * Keep templates as pure functions returning { subject, html, text }. Easy
 * to unit test, no MJML/handlebars runtime, and the from-address is set by
 * the mailer (not the template).
 */

const SITE = process.env.PUBLIC_SITE_URL || 'https://celebratebanner.com';

module.exports = function deliveryTemplate({ projectId, links, name }) {
  const greet = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
  const expires = new Date(links.expiresAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const subject = '🎉 Your CelebrateBanner is ready';

  const cta = (label, href, primary) => `
    <a href="${href}" style="display:inline-block;background:${primary ? '#0C0E14' : '#FAF8F3'};color:${primary ? '#E8C97A' : '#0C0E14'};padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-family:'Outfit',Arial,sans-serif;font-size:14px;${primary ? '' : 'border:1px solid #C9A84C;'}margin:6px 4px;">${label}</a>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:Georgia,serif;color:#0C0E14;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;margin:0 0 12px;">Your banner is ready.</h1>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;line-height:1.55;color:#3a3d44;">
      ${greet} we&rsquo;ve finished rendering your CelebrateBanner. Click below to download your files.
    </p>
    <div style="margin:24px 0;">
      ${cta('⬇ Download banner', links.downloadUrl, true)}
      ${links.videoUrl ? cta('⬇ Download video slideshow', links.videoUrl, false) : ''}
    </div>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;line-height:1.5;color:#7a7d84;">
      Download links expire <strong>${expires}</strong>. Save the files to your device — you can also re-send them
      from <a href="${SITE}/orders/${encodeURIComponent(projectId)}" style="color:#8B6020;">your order page</a>.
    </p>
    <hr style="border:none;border-top:1px solid #e5e0d3;margin:32px 0;">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;line-height:1.5;color:#a7aab1;">
      CDN4 LLC dba CelebrateBanner · 211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401<br>
      Questions? Reply to this email or contact <a href="mailto:info@celebratebanner.com" style="color:#a7aab1;">info@celebratebanner.com</a>.
    </p>
  </div>
</body></html>`;

  const text = [
    `Your CelebrateBanner is ready.`,
    ``,
    `Download banner: ${links.downloadUrl}`,
    links.videoUrl ? `Download video slideshow: ${links.videoUrl}` : null,
    ``,
    `Links expire ${expires}. Save the files to your device.`,
    `Order page: ${SITE}/orders/${encodeURIComponent(projectId)}`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
