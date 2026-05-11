/**
 * Payment-failure email — sent when an async payment (e.g. ACH) fails after
 * the customer left Checkout. They were not charged.
 */

const SITE = process.env.PUBLIC_SITE_URL || 'https://celebratebanner.com';

module.exports = function failureTemplate({ projectId }) {
  const subject = `There was an issue with your CelebrateBanner payment`;
  const retryUrl = `${SITE}/create?resume=${encodeURIComponent(projectId)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:Georgia,serif;color:#0C0E14;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;margin:0 0 12px;">
      Payment didn&rsquo;t go through.
    </h1>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;line-height:1.55;color:#3a3d44;">
      We couldn&rsquo;t process the payment for your banner. <strong>You haven&rsquo;t been charged.</strong>
      Your banner is still saved — try a different card or payment method:
    </p>
    <div style="margin:24px 0;">
      <a href="${retryUrl}" style="display:inline-block;background:#0C0E14;color:#E8C97A;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-family:'Outfit',Arial,sans-serif;font-size:14px;">
        Try again →
      </a>
    </div>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#7a7d84;">
      Need help? Reply to this email and we&rsquo;ll sort it out.
    </p>
  </div>
</body></html>`;

  const text = [
    `Payment didn't go through.`,
    `We couldn't process the payment for your banner. You haven't been charged.`,
    ``,
    `Try again: ${retryUrl}`,
  ].join('\n');

  return { subject, html, text };
};
