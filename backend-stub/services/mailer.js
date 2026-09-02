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
const readyMadeDeliveryTemplate = require('../email/templates/ready-made-delivery');
const readyMadeConfirmationTemplate = require('../email/templates/ready-made-confirmation');
const recoveryTemplate = require('../email/templates/recovery');
const failureTemplate  = require('../email/templates/failure');
const confirmationTemplate = require('../email/templates/confirmation');
const { readyMadeByTemplateId } = require('../config/ready-made-products');
const { logger } = require('./logger');
const { metrics } = require('./metrics');

const MAIL_FROM = process.env.MAIL_FROM || 'CelebrateBanner <info@celebratebanner.com>';
const POSTMARK_TOKEN = process.env.POSTMARK_API_TOKEN;
const POSTMARK_STREAM = process.env.POSTMARK_STREAM || 'outbound';

/**
 * Delivery email. A ready-made order gets ready-made words: nothing was rendered for it, so
 * the personalized template's rendering language would be a lie. `templateId` is the order's
 * product slug — anything not in the ready-made registry keeps the certified personalized
 * copy byte-for-byte.
 */
async function sendDeliveryEmail({ to, projectId, links, name, templateId }) {
  if (!to) return;
  const readyMade = readyMadeByTemplateId(templateId);
  const { subject, html, text } = readyMade
    ? readyMadeDeliveryTemplate({ productName: readyMade.name, links, name })
    : deliveryTemplate({ projectId, links, name });
  await transport({ to, subject, html, text, kind: readyMade ? 'delivery-ready-made' : 'delivery' });
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

/**
 * Order-confirmation ("we got your order"). Returns true only if actually dispatched.
 *
 * For a ready-made digital order there is no preparation, no queue and no shipping — the
 * artwork is downloadable the moment the payment lands — so that order gets its own copy.
 */
async function sendConfirmationEmail({ to, projectId, templateId, sessionId }) {
  if (!to) return false;
  const readyMade = readyMadeByTemplateId(templateId);
  const { subject, html, text } = readyMade
    ? readyMadeConfirmationTemplate({ projectId, productName: readyMade.name, sessionId })
    : confirmationTemplate({ projectId });
  return transport({ to, subject, html, text, kind: readyMade ? 'confirmation-ready-made' : 'confirmation' });
}

// Returns true only if the provider accepted the message. Existing callers ignore the
// return value; the confirmation endpoint uses it to report { sent } to the web proxy.
async function transport({ to, subject, html, text, kind }) {
  if (!POSTMARK_TOKEN) {
    logger.info({ to, subject, kind }, 'mailer.dryrun');
    return false;
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
      return false;
    }
    metrics.incEmailsSent(kind || 'unknown');
    return true;
  } catch (err) {
    logger.error({ err: err.message, kind }, 'mailer.transport-error');
    return false;
  }
}

module.exports = { sendDeliveryEmail, sendRecoveryEmail, sendFailureEmail, sendConfirmationEmail };
