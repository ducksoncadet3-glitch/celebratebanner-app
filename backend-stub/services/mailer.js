/**
 * Transactional email service.
 *
 * Templates live in backend-stub/email/templates/*.js as pure functions
 * returning { subject, html, text }. The transport (Postmark by default) is
 * a thin POST to the provider.
 *
 * Env:
 *   MAIL_FROM             default 'CelebrateBanner <info@celebratebanner.com>'
 *   POSTMARK_API_TOKEN    transport token; without it we log only (dev mode)
 *   POSTMARK_STREAM       default 'outbound'
 */

const deliveryTemplate = require('../email/templates/delivery');
const recoveryTemplate = require('../email/templates/recovery');
const failureTemplate  = require('../email/templates/failure');
const { logger } = require('./logger');
const { metrics } = require('./metrics');

const MAIL_FROM = process.env.MAIL_FROM || 'CelebrateBanner <info@celebratebanner.com>';
const POSTMARK_TOKEN = process.env.POSTMARK_API_TOKEN;
const POSTMARK_STREAM = process.env.POSTMARK_STREAM || 'outbound';

async function sendDeliveryEmail({ to, projectId, links, name }) {
  if (!to) return;
  const { subject, html, text } = deliveryTemplate({ projectId, links, name });
  await transport({ to, subject, html, text, kind: 'delivery' });
}

async function sendRecoveryEmail({ to, projectId, recoveryToken, photoCount }) {
  if (!to) return;
  const { subject, html, text } = recoveryTemplate({ projectId, recoveryToken, photoCount });
  await transport({ to, subject, html, text, kind: 'recovery' });
}

async function sendFailureEmail({ to, projectId }) {
  if (!to) return;
  const { subject, html, text } = failureTemplate({ projectId });
  await transport({ to, subject, html, text, kind: 'failure' });
}

async function transport({ to, subject, html, text, kind }) {
  if (!POSTMARK_TOKEN) {
    logger.info({ to, subject, kind }, 'mailer.dryrun');
    return;
  }
  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_TOKEN,
      },
      body: JSON.stringify({
        From: MAIL_FROM,
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text,
        MessageStream: POSTMARK_STREAM,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body: body.slice(0, 200), kind }, 'mailer.send-failed');
      return;
    }
    metrics.incEmailsSent(kind || 'unknown');
  } catch (err) {
    logger.error({ err: err.message, kind }, 'mailer.transport-error');
  }
}

module.exports = { sendDeliveryEmail, sendRecoveryEmail, sendFailureEmail };
