import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection, MailLink } from '@/components/legal/legal-page';

export const metadata = buildMetadata({
  title: 'Return & Refund Policy',
  description: 'CelebrateBanner reprints, refunds, cancellation windows, shipping issues, and how to report a problem with your order.',
  path: '/returns',
});

/**
 * Migrated in full from https://www.celebratebanner.com/returns (15 sections). No stale
 * vendor references (Stripe is the only named processor, preserved). All substantive terms
 * are preserved verbatim. Address is the owner-approved canonical value: 211 Old Okeechobee
 * Road, Bay 2 #1058, West Palm Beach, FL 33401.
 */
export default function ReturnsPage() {
  return (
    <LegalPage title="Return & Refund Policy" lastUpdated="August 22, 2026">
      <LegalSection title="Quick summary">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-obsidian/15 text-left">
                <th className="py-2 pr-4 font-semibold text-obsidian">Outcome</th>
                <th className="py-2 font-semibold text-obsidian">When it applies</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Free reprint</strong></td><td className="py-2">Banner arrives damaged, defective, or different from your approved preview.</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>Free resend</strong></td><td className="py-2">Digital download fails to deliver or arrives corrupted.</td></tr>
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4"><strong>25% off reprint</strong></td><td className="py-2">Typo, wrong photo, or wrong address (errors visible in your preview).</td></tr>
              <tr><td className="py-2 pr-4"><strong>No refund</strong></td><td className="py-2">Change of mind after the cancellation window closes.</td></tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="1. Overview">
        <p>At CelebrateBanner (operated by CDN4 LLC), every product is made-to-order and personalized based on the images, text, and design selections you provide. Because each banner is uniquely created for you, our return and refund policy is structured to protect both the integrity of our production process and your satisfaction as a customer.</p>
        <p>The sections below explain exactly when you are entitled to a free reprint, when you can get a discounted corrected reprint, when refunds apply, and the limited circumstances where neither is available.</p>
      </LegalSection>

      <LegalSection title="2. No Returns on Custom Products">
        <p>All sales are final once production has begun. Because each banner is uniquely created for your order, we do not accept returns or exchanges for:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Incorrect images uploaded by the customer</li>
          <li>Spelling, layout, or design errors that were visible and approved in your preview</li>
          <li>Change of mind after the cancellation window has closed (see Section 7)</li>
          <li>Sizing decisions that were correctly fulfilled but turned out smaller or larger than you wanted</li>
          <li>Color preferences where the printed result is within normal CMYK reproduction tolerances (see Section 9)</li>
        </ul>
        <p>Customers are responsible for reviewing all details carefully before placing an order.</p>
      </LegalSection>

      <LegalSection title="3. Order Review & Approval Responsibility">
        <p>Before checkout, customers are given the opportunity to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Upload and position images</li>
          <li>Customize layout, text, and theme selections</li>
          <li>Preview the final design exactly as it will print</li>
        </ul>
        <p>By completing your purchase, you confirm that the preview accurately reflects your intended design and that all uploaded content meets your expectations.</p>
        <p>CelebrateBanner is not responsible for design choices, typos, or photo selections that were visible and approved in the preview. If the printed banner materially differs from your approved preview through a fault on our side, the resolution falls under Sections 4 and 5 below.</p>
      </LegalSection>

      <LegalSection title="4. Damaged, Defective, or Incorrect Items">
        <p>We stand behind the quality of our products. You are entitled to a free reprint and reshipment, or a full refund of the print cost, if your banner:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Arrives physically damaged (tears, creases, water damage, punctures from shipping)</li>
          <li>Has print defects (smearing, color banding, faded ink, off-center printing, mis-cut edges)</li>
          <li>Is the wrong product (wrong size, wrong theme, wrong design printed)</li>
          <li>Is materially different from your approved preview</li>
          <li>Does not arrive due to confirmed carrier loss (see Section 8)</li>
        </ul>
        <p className="font-medium text-obsidian">How to qualify</p>
        <p>To qualify for a free reprint or refund, you must:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Contact us within 14 days of delivery</li>
          <li>Provide your order number</li>
          <li>Include 2–4 clear photos of the issue (and the shipping box if damage is shipping-related)</li>
          <li>Include a short description of the problem</li>
        </ul>
        <p>Email info@celebratebanner.com with the subject line &ldquo;Reprint Request – Order #[your order number].&rdquo; We respond within 1 business day. For approved claims, we will offer either a free reprint or a full refund of the print cost based on the nature of the issue, the timing, and your preference.</p>
        <p>You don&apos;t need to send the original banner back. For most defects, we ask you to dispose of or recycle the original — return shipping is rarely worthwhile for either of us. We may ask for additional photos before approving the reprint.</p>
      </LegalSection>

      <LegalSection title="5. Production Errors">
        <p>If the error is on our side — for example, a misprint, the wrong layout applied despite your correct submission, or a quality control failure — we will:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Reprint and ship a replacement at no cost, or</li>
          <li>Issue a full refund (including original shipping)</li>
        </ul>
        <p>You choose the resolution that works best for your situation.</p>
      </LegalSection>

      <LegalSection title="6. Customer Errors — Discounted Corrected Reprint">
        <p>If the issue is something you can fix on your side, we offer a 25% discount on a corrected reprint. This covers:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Typos or misspellings in the text you typed</li>
          <li>Wrong photo uploaded</li>
          <li>Wrong recipient name, date, or event details</li>
          <li>Wrong shipping address you provided at checkout (where the package was successfully delivered to that address)</li>
          <li>Wrong size selected (e.g., 18×24&quot; ordered when 24×36&quot; was needed)</li>
        </ul>
        <p>Email us with your order number and the corrected file or text. We&apos;ll send a custom checkout link with the discount applied.</p>
        <p>Please double-check your preview. The 25%-off reprint is not a refund — corrected reprints are at your cost (minus 25%). It&apos;s our way of helping when mistakes happen, but the original order remains valid.</p>
      </LegalSection>

      <LegalSection title="7. Order Cancellations">
        <p>Orders may be canceled for a full refund within 15 minutes of placement, provided that production has not yet started. Our system sends orders to our print fulfillment partner shortly after checkout, so cancellations after this window cannot be guaranteed. We will still try to catch the order in time if you contact us quickly, but we cannot promise it.</p>
        <p className="font-medium text-obsidian">How to cancel</p>
        <p>Email info@celebratebanner.com with the subject line &ldquo;Cancel Order – Order #[your order number].&rdquo; Our support hours are 9 AM – 6 PM ET, Monday through Friday. We respond as quickly as possible during those hours; emails outside business hours are addressed the next business day. If you email outside business hours and we miss the cancellation window, we will honor the cancellation if production hadn&apos;t started when your email arrived.</p>
        <p>Digital downloads may be canceled within 5 minutes of order if the download link has not yet been opened.</p>
      </LegalSection>

      <LegalSection title="8. Shipping Issues">
        <p className="font-medium text-obsidian">Carrier delays</p>
        <p>We are not responsible for delays caused by carriers, weather events, or other circumstances outside our control. Estimated delivery times are provided in good faith but are not guaranteed. We recommend ordering at least 7 days before your event date. See our <Link href="/shipping" className="text-gold-dark underline-offset-2 hover:underline">Shipping Policy</Link> for production and transit estimates.</p>
        <p className="font-medium text-obsidian">Incorrect addresses</p>
        <p>If you provide an incorrect shipping address and the package is delivered to that address, we cannot refund or reprint at no charge — the carrier&apos;s records show successful delivery. We can offer a 25% discount on a reprint shipped to the corrected address (Section 6).</p>
        <p>If a package is returned to us as undeliverable due to an incorrect address, we will contact you to confirm a corrected address and reship at the actual cost of shipping (typically $9–$15 depending on size and destination — no reprint fee).</p>
        <p className="font-medium text-obsidian">Lost in transit</p>
        <p>If your tracking shows &ldquo;delivered&rdquo; but you do not have the package, please:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Check with neighbors and your building&apos;s mailroom or front desk</li>
          <li>Look in unusual delivery spots (side gates, behind planters, building lobbies)</li>
          <li>Wait 24 hours — carriers occasionally mark packages &ldquo;delivered&rdquo; up to a day early</li>
          <li>If still missing, email us so we can open a carrier trace</li>
        </ol>
        <p>If the carrier confirms loss, or if 5 business days pass with no resolution after we open the trace, we will reprint and reship at no charge.</p>
      </LegalSection>

      <LegalSection title="9. Color Accuracy">
        <p>Every screen displays color differently. Phones, laptops, and tablets all render the same image with slight variations in saturation, brightness, and hue. Printed banners are produced in CMYK; screens display in RGB. We color-correct to the best of our ability, but minor variation between your screen and the printed result is normal and is not considered a defect.</p>
        <p>If the printed colors are dramatically different from your preview (for example, a red banner arrives orange, or a navy background prints purple), that is a print defect under Section 4 and we will reprint at no charge.</p>
      </LegalSection>

      <LegalSection title="10. Digital Downloads">
        <p>Digital downloads are non-refundable once delivered, because the file cannot be returned. However, we will resend your file at no charge if:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>The download link expired before you used it (links are valid for 30 days; we extend on request)</li>
          <li>The PDF or JPG won&apos;t open or appears corrupted</li>
          <li>The email never arrived (please check spam first; we&apos;ll resend manually if needed)</li>
          <li>You need it in a different format we offer (PDF instead of JPG, or vice versa)</li>
        </ul>
        <p>Email info@celebratebanner.com with your order number and we&apos;ll resend within 1 business day.</p>
      </LegalSection>

      <LegalSection title="11. Refund Processing">
        <p>If a refund is approved, it will be issued to the original payment method via Stripe.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-obsidian/15 text-left">
                <th className="py-2 pr-4 font-semibold text-obsidian">Payment method</th>
                <th className="py-2 font-semibold text-obsidian">Typical refund timing</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-obsidian/8"><td className="py-2 pr-4">Credit and debit cards</td><td className="py-2">5–10 business days to appear on your statement</td></tr>
              <tr><td className="py-2 pr-4">Apple Pay / Google Pay</td><td className="py-2">5–10 business days, refunded to the underlying card</td></tr>
            </tbody>
          </table>
        </div>
        <p>Where sales tax was collected, the refund includes the corresponding tax amount, calculated proportionally to the refunded portion of your order.</p>
        <p>Store credit is available in lieu of a card refund if you specifically request it.</p>
      </LegalSection>

      <LegalSection title="12. Chargebacks">
        <p>If you have a problem with your order, please contact us first. Filing a chargeback before reaching out means we cannot help directly — we have to respond to the dispute through Stripe instead of simply fixing the issue. Most disputes are resolved in your favor faster by emailing us than by filing a chargeback.</p>
        <p>If a chargeback is filed without prior contact, we will respond with the order details, your approved preview, proof of delivery, and this policy. Chargebacks filed in bad faith — for example, where carrier records show delivery and no contact was attempted — may result in your account being blocked from future orders.</p>
      </LegalSection>

      <LegalSection title="13. Wholesale and Custom Orders">
        <p>Orders of 10 or more banners and any custom enterprise or event order are governed by the terms in your specific written quote, which may differ from this policy. Contact info@celebratebanner.com for wholesale inquiries.</p>
      </LegalSection>

      <LegalSection title="14. Contact Information">
        <p>For all return, reprint, or refund requests, please contact us:</p>
        <p>
          <strong>CDN4 LLC, dba CelebrateBanner</strong><br />
          211 Old Okeechobee Road, Bay 2 #1058<br />
          West Palm Beach, FL 33401<br />
          Email: <MailLink /><br />
          Subject: &ldquo;Refund Request – Order #[your order number]&rdquo;
        </p>
        <p>We respond within 1 business day, usually faster during business hours.</p>
      </LegalSection>

      <LegalSection title="15. Policy Acceptance">
        <p>By placing an order with CelebrateBanner, you agree to this Return &amp; Refund Policy in full. This policy is incorporated into our <Link href="/terms" className="text-gold-dark underline-offset-2 hover:underline">Terms of Service</Link>; in the event of any inconsistency between this policy and the Terms regarding refunds and returns, this policy governs.</p>
        <p>CelebrateBanner reserves the right to update this policy. The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent version. Material changes will be communicated by email (if we have your address) or by a notice on this page at least 14 days before they take effect.</p>
      </LegalSection>
    </LegalPage>
  );
}
