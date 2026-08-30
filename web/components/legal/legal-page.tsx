import type { ReactNode } from 'react';
import { Section } from '@/components/ui/section';

/**
 * Shared shell for the four legal pages (/terms, /privacy, /returns, /shipping).
 * Content is migrated from the live celebratebanner.com policies with only factual
 * vendor/infrastructure references reconciled to the verified production stack — no
 * substantive legal clauses invented or silently changed. See the repo report.
 */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <Section background="ivory" spacing="lg" width="narrow" aria-labelledby="legal-title">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">Legal</p>
      <h1 id="legal-title" className="mt-3 font-display text-4xl font-semibold text-obsidian sm:text-5xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-obsidian/50">Last updated: {lastUpdated}</p>
      <div className="mt-8 space-y-7 text-base leading-relaxed text-obsidian/75">{children}</div>
    </Section>
  );
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold text-obsidian">{children}</h2>;
}

/** A titled section: heading + body, with consistent spacing. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <LegalH2>{title}</LegalH2>
      {children}
    </section>
  );
}

export function MailLink() {
  return (
    <a href="mailto:info@celebratebanner.com" className="text-gold-dark underline-offset-2 hover:underline">
      info@celebratebanner.com
    </a>
  );
}
