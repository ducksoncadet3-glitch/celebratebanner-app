/**
 * Abandoned-checkout recovery email — sent ~4 hours after a customer uploaded
 * photos and walked away without paying.
 */

const SITE = process.env.PUBLIC_SITE_URL || 'https://celebratebanner.com';

module.exports = function recoveryTemplate({ projectId, recoveryToken, photoCount }) {
  const subject = `Your banner is still here — pick up where you left off`;
  const resumeUrl = `${SITE}/create?resume=${encodeURIComponent(projectId)}&t=${encodeURIComponent(recoveryToken)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:Georgia,serif;color:#0C0E14;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;margin:0 0 12px;">
      Your banner is saved.
    </h1>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;line-height:1.55;color:#3a3d44;">
      You uploaded ${photoCount} photo${photoCount === 1 ? '' : 's'} but didn&rsquo;t finish checking out.
      Your banner is right where you left it — click below to pick up and place your order.
    </p>
    <div style="margin:24px 0;">
      <a href="${resumeUrl}" style="display:inline-block;background:#0C0E14;color:#E8C97A;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-family:'Outfit',Arial,sans-serif;font-size:14px;">
        Resume my banner →
      </a>
    </div>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#7a7d84;">
      No commitment — designing is free and you only pay at checkout.
    </p>
  </div>
</body></html>`;

  const text = [
    `Your banner is saved.`,
    ``,
    `You uploaded ${photoCount} photo${photoCount === 1 ? '' : 's'} but didn't finish checking out.`,
    `Resume here: ${resumeUrl}`,
  ].join('\n');

  return { subject, html, text };
};
