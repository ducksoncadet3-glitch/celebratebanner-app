import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About CelebrateBanner',
  description:
    'CelebrateBanner makes personalized celebration banners, posters, and social graphics for teams, graduations, and championships — with a free preview before you order.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <Section background="ivory" spacing="lg" width="narrow" aria-labelledby="about-title">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">About us</p>
        <h1 id="about-title" className="mt-3 font-display text-4xl font-semibold text-obsidian sm:text-5xl">
          About CelebrateBanner
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-obsidian/70">
          CelebrateBanner makes personalized celebration banners, posters, and social graphics — for
          teams, graduations, championships, and the milestones that matter. Upload your photos,
          preview your design for free, and order only when you love the result.
        </p>

        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-obsidian">How we work</h2>
          <ul role="list" className="mt-4 space-y-2.5">
            {[
              'Free design preview first — see your personalized design before you pay.',
              'Built from your own photos, colors, and text.',
              'Printed and digital options, where the product supports it.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-obsidian/75">
                <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/15 text-xs text-sage">✓</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-xl border border-obsidian/10 bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-obsidian">The company</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-obsidian/50">Business</dt>
              <dd className="text-obsidian">CDN4 LLC, dba CelebrateBanner</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-obsidian/50">Founder</dt>
              <dd className="text-obsidian">Duckson Cadet, Founder &amp; CEO</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-obsidian/50">Location</dt>
              <dd className="text-obsidian">211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-obsidian/50">Contact</dt>
              <dd className="text-obsidian">
                <Link href="/contact" className="text-gold-dark underline-offset-2 hover:underline">Get in touch</Link>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10">
          <Button asChild variant="gold" size="lg">
            <Link href="/proof">Create Your Free Preview</Link>
          </Button>
          <p className="mt-3 text-sm text-obsidian/55">No payment required to see your preview.</p>
        </div>
      </Section>
    </>
  );
}
