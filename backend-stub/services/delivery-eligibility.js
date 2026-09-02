'use strict';

/**
 * May this order download its artwork right now?
 *
 * The whole authorization decision for self-serve (success-page) delivery, as one pure
 * function over facts already read from the database. It is deliberately dependency-free so
 * the pre-deploy suite can exercise every branch — this is the rule that stands between a
 * paid customer and a $9.99 artwork, and it must never be reasoned about only at a distance
 * through source matching.
 *
 * Deny by default: an unrecognised combination returns 'unavailable', never access.
 */

/** Payment states that mean "this order has been paid for and not reversed". */
const PAID = 'succeeded';
const REFUNDED = 'refunded';

/**
 * @param {object} facts
 * @param {{status: string}|null} facts.project   projects row (status only)
 * @param {{status: string}|null} facts.payment   most recent payments row for the project
 * @param {object|null} facts.readyMade           config/ready-made-products entry, or null
 * @returns {{state: string, allowed: boolean}}
 *
 * States, all customer-facing:
 *   'ok'          — issue a short-lived download authorization
 *   'refunded'    — order was refunded; access is revoked and must stay revoked
 *   'unpaid'      — no succeeded payment (abandoned checkout, or webhook not yet in)
 *   'personalized'— not a ready-made order; the render pipeline owns delivery
 *   'unavailable' — anything else, including an unknown project
 */
function decideDelivery({ project, payment, readyMade }) {
  if (!project) return { state: 'unavailable', allowed: false };

  // Refund wins over everything, and is checked FIRST: a refunded order must never reach a
  // branch that could hand back a token, whatever else is true about it.
  if (project.status === REFUNDED || (payment && payment.status === REFUNDED)) {
    return { state: 'refunded', allowed: false };
  }

  // Not ready-made => this endpoint has nothing to offer. Personalized orders are delivered
  // by the render pipeline and are not changed by any of this.
  if (!readyMade) return { state: 'personalized', allowed: false };

  if (!payment || payment.status !== PAID) return { state: 'unpaid', allowed: false };

  // A ready-made product with no configured master asset is not sellable and not
  // downloadable — readyMadeByTemplateId already returns null in that case, but an explicit
  // check here means a future caller cannot pass a half-configured product through.
  if (!readyMade.masterAssetKey) return { state: 'unavailable', allowed: false };

  return { state: 'ok', allowed: true };
}

/** Customer-facing copy for a denied state. Never leaks internal detail. */
const MESSAGES = {
  refunded: 'This download is no longer available because this order was refunded.',
  unpaid: 'We have not received payment for this order yet.',
  personalized: 'This order is delivered once your banner finishes rendering.',
  unavailable: 'This download is not available.',
};

function messageFor(state) {
  return MESSAGES[state] || MESSAGES.unavailable;
}

module.exports = { decideDelivery, messageFor, MESSAGES };
