import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection, MailLink } from '@/components/legal/legal-page';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'How CelebrateBanner collects, uses, shares, and retains the information you provide.',
  path: '/privacy',
});

/**
 * Migrated from https://www.celebratebanner.com/privacy. Substantive clauses (retention,
 * rights, children, security, governing terms) preserved verbatim. Owner-approved factual
 * reconciliations only:
 *   • Sub-processor table reconciled to the verified stack: Cloudinary → AWS (S3 + CloudFront),
 *     SendGrid → Postmark, Vercel + Railway → Fly.io, Cloudflare → AWS CloudFront; Neon
 *     (database) and Upstash (Redis) added; GitHub kept.
 *   • Printmoz + B2Sign REMOVED — the print-fulfillment partner is not finalized; no
 *     replacement invented (owner decision).
 *   • Canonical address: 211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401.
 * Retention §4 (uploads 90d, renders 12mo) and the EXIF §1 claim are now backed by
 * implementation: s3-lifecycle.json expires uploads@90d / renders@365d, and the image
 * optimizer re-encodes the original without metadata. See the repo report.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="August 22, 2026">
      <LegalSection title="1. Information We Collect">
        <p className="font-medium text-obsidian">Information you provide</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Order &amp; contact information:</strong> name, email address, shipping address, phone (if provided).</li>
          <li><strong>Billing information:</strong> processed directly by Stripe. Transaction ID, last four digits of card, and card brand received. Full card number not stored.</li>
          <li><strong>Photos &amp; banner content:</strong> uploaded images, text (names, dates, messages), theme and layout choices.</li>
          <li><strong>Support communications:</strong> email, form, or chat content sent to the company.</li>
        </ul>
        <p className="mt-2 font-medium text-obsidian">Information collected automatically</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Usage data:</strong> pages viewed, builder steps completed, device type, browser, approximate location from IP.</li>
          <li><strong>Cookies and local storage:</strong> first-party local storage saves in-progress banners.</li>
        </ul>
        <p className="mt-2 font-medium text-obsidian">Information embedded in photos</p>
        <p>EXIF metadata (timestamps, GPS coordinates) is stripped from uploaded photos before rendering or long-term storage.</p>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <ul className="list-disc space-y-1 pl-5">
          <li>Create, render, and deliver banners (digital or printed).</li>
          <li>Process payments and prevent fraud via Stripe.</li>
          <li>Send order confirmations, shipping updates, and support replies.</li>
          <li>Improve the Service through analytics and bug fixes.</li>
          <li>Comply with legal obligations (tax, accounting, lawful requests).</li>
        </ul>
        <p><strong>We do not use your uploaded photos to train AI models.</strong> Marketing use requires express written consent.</p>
        <p className="font-medium text-obsidian">Marketing email</p>
        <p>Opt-in only at checkout or newsletter signup. Unsubscribe via email link or <MailLink />. Transactional emails sent regardless.</p>
      </LegalSection>

      <LegalSection title="3. Who We Share Information With">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-obsidian/15 text-left">
                <th className="py-2 pr-4 font-semibold text-obsidian">Sub-processor</th>
                <th className="py-2 pr-4 font-semibold text-obsidian">Purpose</th>
                <th className="py-2 font-semibold text-obsidian">Data shared</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Stripe, Inc.</strong></td><td className="py-2 pr-4">Payment processing</td><td className="py-2">Name, email, billing address, card data</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Amazon Web Services</strong> (S3, CloudFront)</td><td className="py-2 pr-4">Photo/render storage and file delivery</td><td className="py-2">Uploaded photos, banner renders, banner files</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Fly.io</strong></td><td className="py-2 pr-4">Website and backend hosting</td><td className="py-2">IP address, request logs, order data</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Neon</strong> (PostgreSQL)</td><td className="py-2 pr-4">Database — order and project records</td><td className="py-2">Order and project data, email, shipping address</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Upstash</strong> (Redis)</td><td className="py-2 pr-4">Cache and job queue</td><td className="py-2">Order/render processing data</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Postmark</strong></td><td className="py-2 pr-4">Transactional email</td><td className="py-2">Email address, order details</td></tr>
              <tr><td className="py-2 pr-4"><strong>GitHub, Inc.</strong></td><td className="py-2 pr-4">Source code repository</td><td className="py-2">No customer data</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3"><strong>We do not sell your personal information.</strong> Data is never shared with multiple print partners for a single order.</p>
      </LegalSection>

      <LegalSection title="4. Data Retention">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Uploaded photos &amp; drafts:</strong> 90 days after last edit, then deleted. Final renders (post-order): 12 months.</li>
          <li><strong>Order records:</strong> 7 years (tax/accounting compliance).</li>
          <li><strong>Account &amp; marketing email:</strong> until unsubscribe or deletion request.</li>
          <li><strong>Server logs:</strong> 30 days.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Cookies and Tracking">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Strictly necessary:</strong> local storage for in-progress banners; session cookies for checkout.</li>
          <li><strong>Analytics:</strong> first-party analytics only; no third-party tracking pixels or advertising cookies.</li>
        </ul>
        <p>Clearing cookies/local storage discards unsaved banners.</p>
      </LegalSection>

      <LegalSection title="6. Your Privacy Rights">
        <p className="font-medium text-obsidian">All customers</p>
        <p>Email <MailLink /> to request:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Copy of personal information held</li>
          <li>Correction of inaccuracies</li>
          <li>Deletion (subject to legal retention)</li>
          <li>Marketing email unsubscribe</li>
        </ul>
        <p>Response within 30 days; identity verification may be required.</p>
        <p className="font-medium text-obsidian">California residents (CCPA/CPRA)</p>
        <p>Right to know, delete, correct, opt out of sale/sharing, and limit sensitive personal information use. No discrimination for exercising rights. Subject line: &ldquo;California Privacy Request.&rdquo;</p>
        <p className="font-medium text-obsidian">Other US state residents</p>
        <p>Colorado, Connecticut, Virginia, Utah, Texas, Oregon, and Montana residents have similar access, correct, delete, and opt-out rights.</p>
        <p className="font-medium text-obsidian">EU/UK/Swiss residents</p>
        <p>The Service is operated from the US and intended for US customers. <strong>We do not actively market to or solicit orders from the European Economic Area.</strong> Data transferred to the US under contract performance and legitimate interest basis.</p>
      </LegalSection>

      <LegalSection title="7. Children">
        <p>The Service is not directed to children under 13. No information is knowingly collected from minors. You must be 18+ to order, or a parent/guardian completes the purchase.</p>
      </LegalSection>

      <LegalSection title="8. Security">
        <ul className="list-disc space-y-1 pl-5">
          <li>TLS encryption for data in transit</li>
          <li>Encrypted storage at rest with cloud providers</li>
          <li>Access controls limiting personal data visibility</li>
          <li>Stripe handles all card data</li>
        </ul>
        <p>No system is 100% secure. Breaches are notified per applicable law.</p>
      </LegalSection>

      <LegalSection title="9. International Users">
        <p>CelebrateBanner is operated from the US and intended for US customers. Using the service constitutes consent to US data transfer and processing under US law.</p>
      </LegalSection>

      <LegalSection title="10. Changes to This Policy">
        <p>Updates are reflected in the &ldquo;Last updated&rdquo; date. Material changes are communicated via email or a 30-day page notice before taking effect.</p>
      </LegalSection>

      <LegalSection title="11. Contact Us">
        <p>
          <strong>CDN4 LLC, dba CelebrateBanner</strong><br />
          211 Old Okeechobee Road, Bay 2 #1058<br />
          West Palm Beach, FL 33401<br />
          Email: <MailLink />
        </p>
        <p className="text-sm text-obsidian/55">
          This policy is incorporated into the{' '}
          <Link href="/terms" className="text-gold-dark underline-offset-2 hover:underline">Terms of Service</Link>,{' '}
          <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link>, and{' '}
          <Link href="/shipping" className="text-gold-dark underline-offset-2 hover:underline">Shipping Policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
