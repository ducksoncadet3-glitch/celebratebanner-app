/**
 * Order-confirmation email — sent once the customer reaches the success page after a
 * confirmed payment. This is the "we got your order" note (distinct from the delivery
 * email, which carries the finished download links). Stripe still sends its own receipt.
 *
 * Copy is preserved verbatim from the original web/app/api/order-confirmation route so
 * consolidating onto Postmark does not change what the customer reads.
 */

module.exports = function confirmationTemplate({ projectId }) {
  const subject = 'Your CelebrateBanner order is confirmed 🎉';

  const text =
    'Thank you for your order!\n\n' +
    'Your payment was received and your banner is being prepared. ' +
    'You will receive your download links (and shipping updates, if applicable) shortly.\n\n' +
    (projectId ? `Order reference: ${projectId}\n` : '') +
    '\n— The CelebrateBanner team';

  const ref = projectId
    ? `<p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7a7d84;">Order reference: ${projectId}</p>`
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
      Thank you for your order! Your payment was received and your banner is being prepared.
      You&rsquo;ll receive your download links (and shipping updates, if applicable) shortly.
    </p>
    ${ref}
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7a7d84;">
      &mdash; The CelebrateBanner team
    </p>
  </div>
</body></html>`;

  return { subject, html, text };
};
