import { PricingCards } from '@/components/pricing-cards';
import { Container } from '@/components/ui/container';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Pricing — Digital, Printed, and Video',
  description:
    'Digital banner $9.99, printed 24×36" banner $79.99 with free shipping, optional video slideshow +$19. Pay once. No subscriptions.',
  path: '/pricing',
});

const FAQ = [
  {
    q: 'Do I pay anything before I see my banner?',
    a: 'No. You can design, upload photos, and preview your banner for free. Payment happens only when you choose to download or order the printed banner.',
  },
  {
    q: 'What file formats do I get with the digital banner?',
    a: 'A print-ready PDF and a high-resolution JPG, both at 300 DPI with 0.125" bleed and a 0.25" safe margin. Send either to any local print shop.',
  },
  {
    q: 'How long does the printed banner take?',
    a: 'We print and ship within 1–2 business days, and the carrier typically delivers in another 2–3 business days. Most US customers receive their banner within 5 business days of ordering.',
  },
  {
    q: 'What is the video slideshow?',
    a: 'A cinematic 60-second video built from the same photos as your banner, with motion and music. Great for sharing on Instagram, TikTok, or in a slideshow at the event.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Digital downloads are non-refundable once delivered. For printed banners, contact us within 7 days of delivery and we&rsquo;ll make it right.',
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="bg-obsidian py-16 text-ivory sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Pricing
            </p>
            <h1 className="mt-4 text-balance text-4xl text-ivory sm:text-5xl">
              Pay once. Keep it forever.
            </h1>
            <p className="mt-4 text-pretty text-ivory/75">
              No subscriptions, no watermarks, no nonsense. Just pick the format that fits and
              we&apos;ll deliver it in minutes.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <PricingCards />
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="faq-heading">
        <Container>
          <h2 id="faq-heading" className="mb-8 text-center text-3xl sm:text-4xl">
            Frequently asked
          </h2>
          <div className="mx-auto max-w-2xl divide-y divide-gold/20 rounded-2xl border border-gold/20 bg-ivory">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-5 sm:p-6">
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-medium">
                  <span>{item.q}</span>
                  <span className="text-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-pretty text-sm text-obsidian/75">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
