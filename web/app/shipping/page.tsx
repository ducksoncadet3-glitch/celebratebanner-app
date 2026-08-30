import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection, MailLink } from '@/components/legal/legal-page';

export const metadata = buildMetadata({
  title: 'Shipping Policy',
  description: 'CelebrateBanner production and transit times, carriers, coverage, costs, tracking, and delivery estimates.',
  path: '/shipping',
});

/**
 * Migrated in full from https://www.celebratebanner.com/shipping (12 sections). No stale
 * infrastructure vendors — carriers are UPS/FedEx/USPS and fulfillment is a generic
 * "print fulfillment partner" (blind dropship). All substantive terms preserved verbatim.
 * Address is the owner-approved canonical value: 211 Old Okeechobee Road, Bay 2 #1058,
 * West Palm Beach, FL 33401.
 */
export default function ShippingPage() {
  return (
    <LegalPage title="Shipping Policy" lastUpdated="August 22, 2026">
      <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm leading-relaxed">
        <strong className="text-obsidian">The short version:</strong> Most vinyl banners ship within
        1–3 business days of order, with delivery 3–7 business days after that. Banner stands and trade
        show displays take a little longer (2–5 business days production). We ship within the United
        States only via standard ground shipping. Digital downloads are delivered by email within 1
        business day. Order at least 7 days before your event for peace of mind.
      </p>

      <LegalSection title="1. Where We Ship">
        <p>CelebrateBanner currently ships physical products only to addresses within the fifty (50) United States and the District of Columbia. We do not currently ship to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>International destinations outside the United States;</li>
          <li>U.S. territories (Puerto Rico, Guam, U.S. Virgin Islands, American Samoa, Northern Mariana Islands);</li>
          <li>APO, FPO, or DPO military addresses;</li>
          <li>Freight-forwarding addresses (orders to known freight-forwarders may be cancelled and refunded).</li>
        </ul>
        <p>If you need a product shipped to one of the above destinations, contact us at <MailLink /> before placing your order — we may be able to arrange a custom quote, but we cannot guarantee it. Digital downloads are available worldwide.</p>
      </LegalSection>

      <LegalSection title="2. Production and Delivery Timing">
        <p>Each product is made-to-order. Total time from order placement to delivery breaks down as follows:</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-obsidian/15 text-left">
                <th className="py-2 pr-4 font-semibold text-obsidian">Stage</th>
                <th className="py-2 font-semibold text-obsidian">Typical timing</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4">Order placed → production starts</td><td className="py-2">Same day or next business day</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4">Production (printing &amp; finishing)</td><td className="py-2">1–3 business days for vinyl banners; 2–5 business days for banner stands, trade show displays, and specialty signage</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4">Transit (US ground shipping)</td><td className="py-2">3–7 business days</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4">Total order to delivery (typical)</td><td className="py-2">5–10 business days for vinyl banners; 7–12 business days for specialty products</td></tr>
              <tr><td className="py-2 pr-4">Digital downloads (delivered by email)</td><td className="py-2">Within 1 business day</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Business days are Monday through Friday, excluding U.S. federal holidays.</strong> Orders placed on weekends or holidays begin production the next business day. Estimated timing is provided in good faith but is not guaranteed — see Section 6 below for what happens when carriers experience delays.</p>
        <p className="font-medium text-obsidian">Different products, different timing</p>
        <p>We produce vinyl banners, banner stands, trade show displays, and specialty signage with the print fulfillment partner best suited for each category. Vinyl banners typically ship faster than retractable banner stands or large trade show displays, which involve additional finishing steps and (for some sizes) more complex packaging. The timing table above shows typical ranges; your order confirmation will give you the specific estimated ship date for your product.</p>
        <p className="font-medium text-obsidian">Rush production</p>
        <p>If you need a product faster than our standard timing, contact us at <MailLink /> before placing your order. Rush production may be available for an additional fee depending on size, theme, product category, and current production capacity. We cannot promise rush turnaround for orders placed without prior arrangement.</p>
      </LegalSection>

      <LegalSection title="3. Shipping Methods and Carriers">
        <p>Physical products ship via UPS, FedEx, or USPS Ground, selected by our print fulfillment partner based on size, weight, and destination to provide the most reliable delivery at a reasonable cost. We do not currently offer expedited (overnight or 2-day) shipping. Larger banners (typically 4×8 ft and above) are shipped rolled in tubes; banner stands ship in dedicated carry cases or shipping tubes; smaller banners may ship folded in boxes or flat envelopes depending on size.</p>
        <p>All physical shipments are sent under a CelebrateBanner return address (blind dropship from our print fulfillment partner). The packing slip and box show CelebrateBanner branding only — the underlying print partner is not identified to recipients.</p>
      </LegalSection>

      <LegalSection title="4. Shipping Costs">
        <p>Shipping costs are calculated at checkout based on the size and weight of your product and the destination ZIP code. The total shipping cost is displayed before you confirm payment, so there are no surprises at delivery.</p>
        <p>Where multiple items are ordered together to a single address, we combine them into the fewest practical shipments to keep shipping costs down. Note that products fulfilled by different print partners may ship separately and arrive on different dates. Sales tax is calculated separately and applies to taxable jurisdictions, including Florida.</p>
        <p className="font-medium text-obsidian">Free shipping promotions</p>
        <p>From time to time we may offer free or discounted shipping on qualifying orders. Promotional terms (minimum order value, eligible products, expiration date) are stated at the time of the offer and apply only to orders placed during the promotional window.</p>
      </LegalSection>

      <LegalSection title="5. Order Tracking">
        <p>When your order ships, we will email you a tracking number and a link to the carrier&apos;s tracking page. Tracking information typically becomes active within 24 hours after the shipping notification is sent. If you do not receive a tracking email within 5 business days of placing your order (or 7 business days for specialty products), please check your spam folder, then contact us at <MailLink /> so we can investigate.</p>
        <p>If your tracking shows the package as delivered but you cannot locate it, follow the steps in Section 8 of our <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link>.</p>
      </LegalSection>

      <LegalSection title="6. Carrier Delays and Force-Majeure Events">
        <p>Once a product is handed to the carrier, the package is in their possession. We are not responsible for delays caused by:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Carrier operational issues, capacity constraints, or sorting errors;</li>
          <li>Severe weather, natural disasters, or other acts of nature;</li>
          <li>Public-health emergencies, strikes, or labor disputes;</li>
          <li>Customs holds, government actions, or other circumstances outside our control.</li>
        </ul>
        <p>That said, we want you to receive your product. If a shipment is significantly delayed, contact us at <MailLink /> and we will open a carrier trace and work with you on a resolution. For confirmed lost shipments, see Section 8 of our <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link>.</p>
      </LegalSection>

      <LegalSection title="7. Address Accuracy">
        <p><strong>Please double-check your shipping address before completing checkout.</strong> Once an order has entered production, we cannot change the shipping address. If you discover an address error within 15 minutes of placing your order, contact us immediately and we will try to update it before production starts (see Section 7 of our <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link> on cancellation timing).</p>
        <p>If you provide an incorrect or incomplete address and the package is delivered to that address, we cannot refund or reprint at no charge — the carrier&apos;s records show successful delivery. If a package is returned to us as undeliverable, we will contact you to arrange a corrected address and reship at the actual cost of shipping (typically $9–$15).</p>
      </LegalSection>

      <LegalSection title="8. Order Date Recommendations">
        <p>Because every product is made to order and shipping involves carriers we don&apos;t control, we strongly recommend ordering well before your event:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>At least <strong>7 business days</strong> before the event for standard vinyl banners within the continental US;</li>
          <li>At least <strong>10 business days</strong> before the event for banner stands, trade show displays, and specialty signage;</li>
          <li>At least <strong>10 business days</strong> for orders to Alaska, Hawaii, or remote rural addresses;</li>
          <li>At least <strong>14 business days</strong> during peak seasons (mid-May through August for graduations and weddings, late October through December for holidays, and around major sporting events).</li>
        </ul>
        <p>If your event is sooner, contact us at <MailLink /> before ordering and we will tell you honestly whether we think we can make your deadline.</p>
      </LegalSection>

      <LegalSection title="9. Damaged, Defective, or Lost Shipments">
        <p>If your order arrives damaged, has print defects, is the wrong product, or does not arrive at all, you are entitled to a free reprint or refund. The full process — including how to qualify, what to send us, and our response timing — is described in Sections 4 and 8 of our <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link>.</p>
      </LegalSection>

      <LegalSection title="10. Digital Downloads">
        <p>Orders for digital download products are delivered by email rather than physical shipment. The download link is typically sent within 1 business day of order. Download links are valid for 30 days; if your link expires before you use it, email us and we will issue a fresh link at no charge. Digital downloads are governed by Section 10 of our <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link>.</p>
      </LegalSection>

      <LegalSection title="11. Changes to This Policy">
        <p>We may update this Shipping Policy from time to time as our carriers, partners, or processes change. The &ldquo;Last updated&rdquo; date at the top reflects the most recent change. The Shipping Policy in effect at the time you place an order governs that order.</p>
      </LegalSection>

      <LegalSection title="12. Contact Us">
        <p>
          <strong>CDN4 LLC, dba CelebrateBanner</strong><br />
          211 Old Okeechobee Road, Bay 2 #1058<br />
          West Palm Beach, FL 33401<br />
          Email: <MailLink />
        </p>
        <p className="text-sm text-obsidian/55">
          This Shipping Policy is incorporated into our{' '}
          <Link href="/terms" className="text-gold-dark underline-offset-2 hover:underline">Terms of Service</Link> and works in conjunction with our{' '}
          <Link href="/returns" className="text-gold-dark underline-offset-2 hover:underline">Return &amp; Refund Policy</Link> and{' '}
          <Link href="/privacy" className="text-gold-dark underline-offset-2 hover:underline">Privacy Policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
