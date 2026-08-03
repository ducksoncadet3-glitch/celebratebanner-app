import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact CelebrateBanner',
  description:
    'Questions before you order or need help with a design? Contact CelebrateBanner by email or phone.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <Section background="ivory" spacing="lg" width="narrow" aria-labelledby="contact-title">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">Contact</p>
      <h1 id="contact-title" className="mt-3 font-display text-4xl font-semibold text-obsidian sm:text-5xl">
        Contact us
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-obsidian/70">
        Questions before you order, or need help with a design? Reach out — we&apos;re happy to help.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-obsidian/10 bg-white p-6">
          <dt className="text-xs font-semibold uppercase tracking-wide text-obsidian/50">Email</dt>
          <dd className="mt-1.5">
            <a href="mailto:info@celebratebanner.com" className="text-lg font-medium text-gold-dark underline-offset-2 hover:underline">
              info@celebratebanner.com
            </a>
          </dd>
        </div>
        <div className="rounded-xl border border-obsidian/10 bg-white p-6">
          <dt className="text-xs font-semibold uppercase tracking-wide text-obsidian/50">Phone</dt>
          <dd className="mt-1.5">
            <a href="tel:+17728349060" className="text-lg font-medium text-gold-dark underline-offset-2 hover:underline">
              +1 772-834-9060
            </a>
          </dd>
        </div>
        <div className="rounded-xl border border-obsidian/10 bg-white p-6 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-obsidian/50">Mailing address</dt>
          <dd className="mt-1.5 text-obsidian">
            CDN4 LLC, dba CelebrateBanner<br />
            211 Old Okeechobee Road, Bay 2 #1058<br />
            West Palm Beach, FL 33401
          </dd>
        </div>
      </dl>

      <div className="mt-10">
        <Button asChild variant="gold" size="lg">
          <Link href="/proof">Start Free Design Proof</Link>
        </Button>
        <p className="mt-3 text-sm text-obsidian/55">No payment required to see your proof.</p>
      </div>
    </Section>
  );
}
