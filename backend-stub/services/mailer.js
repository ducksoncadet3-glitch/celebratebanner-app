/**
 * Transactional email service.
 *
 * Swap the transport for whatever you already use (Postmark, Resend, SES, SMTP).
 * The function signatures stay stable.
 */

const MAIL_FROM = process.env.MAIL_FROM || 'CelebrateBanner <info@celebratebanner.com>';
const POSTMARK_TOKEN = process.env.POSTMARK_API_TOKEN;

async function sendDeliveryEmail({ to, projectId, links }) {
  if (!to) return;
  const subject = 'Your CelebrateBanner is ready 🎉';
  const html = `
    <h1 style="font-family: Georgia, serif;">Your banner is ready</h1>
    <p>Your high-resolution files for project <code>${projectId}</code> are linked below.</p>
    <p><a href="${links.downloadUrl}" style="background:#0C0E14;color:#E8C97A;padding:12px 20px;border-radius:999px;text-decoration:none;">⬇ Download banner</a></p>
    ${links.videoUrl ? `<p><a href="${links.videoUrl}" style="background:#0C0E14;color:#E8C97A;padding:12px 20px;border-radius:999px;text-decoration:none;">⬇ Download video slideshow</a></p>` : ''}
    <p style="color:#666;font-size:12px;">Links expire on ${links.expiresAt}. Save the files to your device.</p>
    <p>— CelebrateBanner</p>
  `;
  await transport({ to, subject, html });
}

async function sendFailureEmail({ to, projectId }) {
  if (!to) return;
  await transport({
    to,
    subject: 'There was an issue with your CelebrateBanner payment',
    html: `<p>We couldn't process the payment for project <code>${projectId}</code>. You haven't been charged. <a href="https://celebratebanner.com/create">Try again →</a></p>`,
  });
}

async function transport({ to, subject, html }) {
  if (!POSTMARK_TOKEN) {
    console.log('[mailer] (no transport configured) →', { to, subject });
    return;
  }
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': POSTMARK_TOKEN,
    },
    body: JSON.stringify({
      From: MAIL_FROM,
      To: to,
      Subject: subject,
      HtmlBody: html,
      MessageStream: 'outbound',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[mailer] send failed', res.status, body);
  }
}

module.exports = { sendDeliveryEmail, sendFailureEmail };
