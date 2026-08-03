import Link from 'next/link';
import { Button } from './ui/button';
import { Container } from './ui/container';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ivory via-ivory to-white pb-20 pt-14 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_55%)]"
      />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="animate-fade-in text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark">
            Custom banners · posters · social graphics · 300 DPI
          </p>
          <h1 className="mt-5 animate-fade-up text-balance text-4xl leading-[1.08] sm:text-5xl md:text-6xl">
            Celebrate Every Achievement with a Personalized Banner{' '}
            <span className="bg-gradient-to-br from-gold-dark via-gold to-gold-light bg-clip-text text-transparent">
              They&apos;ll Never Forget
            </span>
          </h1>
          <p className="mt-6 animate-fade-up text-pretty text-lg text-obsidian/75 [animation-delay:120ms]">
            From championships to graduation, create a custom banner or poster in minutes. Review
            your FREE design proof before placing an order.
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:240ms]">
            <Button asChild size="lg" variant="gold">
              <Link href="/proof">Start Free Design Proof</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/shop">Shop Products</Link>
            </Button>
          </div>
          <p className="mt-6 animate-fade-up text-xs text-obsidian/55 [animation-delay:360ms]">
            No payment required to see your proof · Your photos &amp; colors
          </p>
        </div>

        {/* Visual sample mock — pure CSS banner card */}
        <div
          aria-hidden
          className="relative mx-auto mt-14 max-w-2xl animate-fade-up [animation-delay:480ms]"
        >
          <div className="relative rounded-2xl border border-gold/30 bg-gradient-to-b from-obsidian to-obsidian-50 p-6 shadow-lift sm:p-10">
            <div className="text-center">
              <p className="font-display text-3xl text-gold-pale sm:text-4xl">Class of 2026</p>
              <p className="mt-1 font-display italic text-gold/80">Sarah Johnson · Lincoln High</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-md shimmer ${i === 0 ? 'col-span-2 row-span-2 sm:col-span-2' : ''}`}
                  style={{ backgroundColor: `rgba(201,168,76,${0.08 + (i % 3) * 0.05})` }}
                />
              ))}
            </div>
          </div>
          <div className="absolute -inset-x-10 -bottom-6 -z-10 mx-auto h-20 max-w-md rounded-full bg-gold/15 blur-3xl" />
        </div>
      </Container>
    </section>
  );
}
