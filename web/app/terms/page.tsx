import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection, MailLink } from '@/components/legal/legal-page';

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'CelebrateBanner Terms of Service — the agreement that governs use of the service and your orders.',
  path: '/terms',
});

/**
 * Migrated verbatim (substantive clauses) from https://www.celebratebanner.com/terms.
 * Only stale factual vendor references were reconciled: "Cloudinary (image storage)" →
 * AWS (Amazon S3 storage + CloudFront delivery). No clause language, governing law, venue,
 * liability caps, or timeframes were changed. Address is the owner-approved canonical value:
 * 211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401.
 */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="August 22, 2026">
      <LegalSection title="1. Agreement to These Terms">
        <p>
          These Terms of Service form a binding agreement between you and CDN4 LLC (doing business as
          CelebrateBanner) regarding use of celebratebanner.com and related services. By accessing the
          Service or placing an order, you agree to these Terms, the{' '}
          <Link href="/privacy" className="text-gold-dark underline-offset-2 hover:underline">Privacy Policy</Link>, and the{' '}
          <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>To use the Service, you must:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Be at least 18 years old (or have a parent/legal guardian complete the order)</li>
          <li>Have legal capacity to enter into a binding contract</li>
          <li>Provide accurate information at checkout</li>
          <li>Use the Service only for lawful purposes</li>
        </ul>
        <p>CelebrateBanner may refuse service or terminate access if these conditions aren&apos;t met.</p>
      </LegalSection>

      <LegalSection title="3. Your Content and the License You Grant Us">
        <p><strong>You own your content:</strong> You retain ownership of all photos, text, names, logos, and other content you upload (&ldquo;User Content&rdquo;).</p>
        <p>
          <strong>Limited license to fulfill your order:</strong> By uploading User Content, you grant
          CelebrateBanner and its sub-processors a worldwide, non-exclusive, royalty-free license to
          store, copy, host, transmit, render, and process your content for production, printing, and
          shipping purposes only. The license does not extend to marketing, advertising, or AI training
          without express written consent.
        </p>
        <p>Sub-processors named include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Amazon Web Services — Amazon S3 (file storage) and Amazon CloudFront (delivery)</li>
          <li>Print fulfillment partners</li>
          <li>Other vendors listed in the Privacy Policy</li>
        </ul>
        <p><strong>Your warranties about User Content:</strong> You represent that:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>You own the content or have valid permission to use it</li>
          <li>You&apos;ve obtained necessary consents from people depicted (or parents/guardians for minors)</li>
          <li>The content doesn&apos;t infringe third-party rights</li>
          <li>The content complies with applicable law</li>
        </ul>
        <p>You agree to indemnify CelebrateBanner against third-party claims arising from your User Content.</p>
      </LegalSection>

      <LegalSection title="4. Prohibited Content and Use">
        <p>You may not upload content that is:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sexually explicit, pornographic, or sexualizes minors</li>
          <li>Depicts graphic violence, gore, or self-harm</li>
          <li>Promotes hatred, harassment, or discrimination</li>
          <li>Infringes copyrights, trademarks, or IP rights (including unlicensed celebrity photos)</li>
          <li>Includes images of identifiable people without consent</li>
          <li>Violates applicable law</li>
        </ul>
        <p>CelebrateBanner reserves the right to refuse, cancel, or refund orders violating this section.</p>
        <p>You also agree not to: reverse-engineer the Service, scrape content, send spam, access unauthorized accounts, or use automated systems to place orders without written consent.</p>
      </LegalSection>

      <LegalSection title="5. Orders, Pricing, and Payment">
        <p><strong>Pricing:</strong> All prices are in U.S. dollars excluding sales tax (calculated at checkout). CelebrateBanner may update pricing; the price at order submission applies to that order.</p>
        <p><strong>Order acceptance:</strong> Your order submission is an offer; CelebrateBanner accepts by sending a confirmation email and charging your payment method. CelebrateBanner reserves the right to decline orders for fraud suspicion, unavailability, Content violations, or pricing errors.</p>
        <p><strong>Payment:</strong> Stripe processes payments. You authorize CelebrateBanner to charge your selected method for the full order total. Failed payments may result in cancellation.</p>
        <p><strong>Pricing errors:</strong> If a banner is listed at a clearly incorrect price, CelebrateBanner may cancel the order and issue a full refund, even after confirmation.</p>
      </LegalSection>

      <LegalSection title="6. Production, Shipping, and Delivery">
        <p>
          Production and shipping are governed by the{' '}
          <Link href="/shipping" className="text-gold-dark underline-offset-2 hover:underline">Shipping Policy</Link>{' '}
          (incorporated into these Terms). Estimated delivery dates are provided in good faith but not guaranteed.
        </p>
        <p>Risk of loss and title pass to you when the carrier delivers to your shipping address. For digital downloads, risk passes when the download link is delivered to your email.</p>
      </LegalSection>

      <LegalSection title="7. Returns, Refunds, and Cancellations">
        <p>
          Returns, reprints, refunds, and cancellations are governed by the{' '}
          <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link>{' '}
          (incorporated into these Terms). The Return &amp; Refund Policy governs in case of inconsistency.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property of CelebrateBanner">
        <p>The Service—including the banner builder, website, trademarks, themes, templates, software, and overall design—is owned by CDN4 LLC or licensors and protected by U.S. and international IP law.</p>
        <p>CelebrateBanner grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for designing and ordering banners for personal or business use. You may not copy, modify, distribute, sell, or lease any part of the Service.</p>
        <p>Your finished banner is yours to use for lawful, non-commercial purposes related to the event for which it was created. Resale of CelebrateBanner templates as standalone designs requires written consent.</p>
      </LegalSection>

      <LegalSection title="9. Third-Party Services and Links">
        <p>The Service relies on third-party providers including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stripe (payments)</li>
          <li>Amazon Web Services — Amazon S3 and CloudFront (file storage and delivery)</li>
          <li>Print fulfillment partners</li>
        </ul>
        <p>CelebrateBanner is not responsible for third-party practices, content, or availability.</p>
      </LegalSection>

      <LegalSection title="10. Disclaimers">
        <p>The Service and products are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. CelebrateBanner disclaims all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
        <p>CelebrateBanner does not warrant uninterrupted service, error-free operation, security, or virus-free servers. Minor color and calibration variations between screen preview and printed banner are normal.</p>
        <p>This section does not limit rights under the Return &amp; Refund Policy or non-waivable consumer protections under Florida or federal law.</p>
      </LegalSection>

      <LegalSection title="11. Limitation of Liability">
        <p>CelebrateBanner is not liable for indirect, incidental, consequential, special, or punitive damages, or for lost profits, lost data, or loss of goodwill, even if advised of such possibility.</p>
        <p>Total cumulative liability does not exceed the greater of: (a) the total amount paid for the order giving rise to the claim, or (b) $100.</p>
        <p>Some jurisdictions prohibit exclusion or limitation of certain damages; liability is limited to the smallest amount permitted by law in those cases.</p>
      </LegalSection>

      <LegalSection title="12. Indemnification">
        <p>You agree to indemnify, defend, and hold harmless CelebrateBanner and CDN4 LLC from third-party claims arising from:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your User Content</li>
          <li>Breach of these Terms</li>
          <li>Violation of law</li>
          <li>Misuse of the Service</li>
        </ul>
        <p>CelebrateBanner may assume exclusive defense and control, and you agree to cooperate.</p>
      </LegalSection>

      <LegalSection title="13. Governing Law and Dispute Resolution">
        <p><strong>Governing law:</strong> These Terms are governed by Florida law without regard to conflict of laws principles. The UN Convention on Contracts for the International Sale of Goods does not apply.</p>
        <p><strong>Informal dispute resolution:</strong> Before filing formal claims, contact info@celebratebanner.com with subject line &ldquo;Dispute,&rdquo; providing a written description, order number, and requested resolution. Both parties agree to attempt in-good-faith resolution for at least 30 days.</p>
        <p><strong>Venue:</strong> Any lawsuit is brought exclusively in state or federal courts in Palm Beach County, Florida. Either party may seek injunctive relief in any court to protect IP rights.</p>
        <p><strong>Small claims preserved:</strong> Nothing prevents either party from bringing an action in small claims court within jurisdictional limits.</p>
        <p><strong>Time limit:</strong> Claims must be filed within one year after the cause of action arises; otherwise, the claim is permanently barred.</p>
      </LegalSection>

      <LegalSection title="14. Termination">
        <p>You may stop using the Service at any time. CelebrateBanner may suspend or terminate access if you breach these Terms, engage in fraudulent activity, or if continued service creates risk.</p>
        <p>Sections 3, 4, 8, 10, 11, 12, 13, and 16 survive termination.</p>
      </LegalSection>

      <LegalSection title="15. Changes to These Terms">
        <p>CelebrateBanner may update these Terms. The &ldquo;Last updated&rdquo; date reflects the most recent change. Material changes will be communicated by email or on this page at least 30 days before taking effect. Continued use after changes take effect means you accept the updated Terms. The Terms at the time of order govern that order.</p>
      </LegalSection>

      <LegalSection title="16. General Provisions">
        <p><strong>Entire agreement:</strong> These Terms, together with the Privacy Policy, Return &amp; Refund Policy, and Shipping Policy, constitute the entire agreement and supersede prior agreements.</p>
        <p><strong>Severability:</strong> If any provision is invalid or unenforceable, remaining provisions remain in full force.</p>
        <p><strong>No waiver:</strong> Failure to enforce any right is not a waiver of that right.</p>
        <p><strong>Assignment:</strong> You may not assign these Terms without written consent. CelebrateBanner may assign freely, including in mergers or acquisitions.</p>
        <p><strong>Force majeure:</strong> CelebrateBanner is not liable for failures or delays caused by events beyond reasonable control, including natural disasters, carrier disruptions, supplier failures, labor disputes, public-health emergencies, or government actions.</p>
        <p><strong>Notices:</strong> Notices to CelebrateBanner go to info@celebratebanner.com. Notices to you go to your most recent order email address.</p>
      </LegalSection>

      <LegalSection title="17. Contact Us">
        <p>
          <strong>CDN4 LLC, dba CelebrateBanner</strong><br />
          211 Old Okeechobee Road, Bay 2 #1058<br />
          West Palm Beach, FL 33401<br />
          Email: <MailLink />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
