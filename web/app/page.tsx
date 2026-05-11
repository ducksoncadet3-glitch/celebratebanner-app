import Link from 'next/link';
import { Hero } from '@/components/hero';
import { ThemeGrid } from '@/components/theme-grid';
import { PricingCards } from '@/components/pricing-cards';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Custom Celebration Banners — Designed in Minutes',
  description:
    'Design luxury celebration banners for graduations, weddings, and milestones. 300 DPI print-ready, digital or printed, delivered in minutes.',
  path: '/',
});

const VALUE_PROPS = [
  {
    title: '300 DPI print-ready',
    body: 'Every banner exports as print-grade PDF + JPG with bleed and safe margins baked in.',
  },
  {
    title: 'Up to 50 photos',
    body: 'Upload one hero shot or a whole album — we lay it all out beautifully.',
  },
  {
    title: 'Digital or printed',
    body: 'Download instantly or have a 24×36" banner shipped to your door in 3–5 days.',
  },
];

const STEPS = [
  { n: '01', title: 'Pick a template', body: 'Graduation, wedding, anniversary, milestone — every theme is hand-tuned.' },
  { n: '02', title: 'Upload your photos', body: 'One hero plus up to 49 supporting. We crop, frame, and arrange them for you.' },
  { n: '03', title: 'Download or order print', body: 'Pay once, get the digital file instantly. Print delivery in 3–5 business days.' },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="py-20 sm:py-24" aria-labelledby="value-heading">
        <Container>
          <div className="mb-12 text-center">
            <h2 id="value-heading" className="text-balance text-3xl sm:text-4xl">
              Built for the moments that matter
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-obsidian/70">
              CelebrateBanner turns a stack of phone photos into a banner you&apos;ll actually want on the wall.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {VALUE_PROPS.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-gold/20 bg-white p-7 shadow-lift transition hover:-translate-y-1 hover:border-gold/40"
              >
                <div className="gold-divider mb-5" />
                <h3 className="text-xl">{v.title}</h3>
                <p className="mt-2 text-sm text-obsidian/70">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24" aria-labelledby="how-heading">
        <Container>
          <div className="mb-12 text-center">
            <h2 id="how-heading" className="text-balance text-3xl sm:text-4xl">How it works</h2>
            <p className="mt-3 text-obsidian/70">From upload to wall in under five minutes.</p>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="relative">
                <span className="font-display text-5xl text-gold/40">{s.n}</span>
                <h3 className="mt-2 text-xl">{s.title}</h3>
                <p className="mt-1 text-sm text-obsidian/70">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/create">Start designing — it&apos;s free until checkout</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24" aria-labelledby="themes-heading">
        <Container>
          <div className="mb-10 text-center">
            <h2 id="themes-heading" className="text-balance text-3xl sm:text-4xl">
              Themes for every milestone
            </h2>
            <p className="mt-3 text-obsidian/70">Each theme has its own palette, typography, and layout.</p>
          </div>
          <ThemeGrid />
        </Container>
      </section>

      <section id="pricing" className="bg-white py-20 sm:py-24" aria-labelledby="pricing-heading">
        <Container>
          <div className="mb-10 text-center">
            <h2 id="pricing-heading" className="text-balance text-3xl sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-obsidian/70">Pay once. No subscriptions, no hidden fees.</p>
          </div>
          <PricingCards />
        </Container>
      </section>
    </>
  );
}
