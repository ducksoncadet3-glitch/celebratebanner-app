import { Section } from '@/components/ui/section';

/** Clean line-icons (no emoji) for each audience. */
function AudienceIcon({ kind }: { kind: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    school: <><path d="M3 10l9-5 9 5-9 5-9-5z" {...common} /><path d="M7 12v4c0 1 2.2 2 5 2s5-1 5-2v-4" {...common} /></>,
    sports: <><circle cx="12" cy="12" r="8" {...common} /><path d="M12 4v16M4 12h16" {...common} /></>,
    highschool: <><path d="M5 21V7l7-4 7 4v14" {...common} /><path d="M9 21v-5h6v5" {...common} /></>,
    college: <><path d="M12 4l9 4-9 4-9-4 9-4z" {...common} /><path d="M6 10v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" {...common} /><path d="M21 8v5" {...common} /></>,
    booster: <><path d="M4 10v4h3l6 4V6L7 10H4z" {...common} /><path d="M17 9a4 4 0 010 6" {...common} /></>,
    families: <><circle cx="9" cy="8" r="2.4" {...common} /><circle cx="16" cy="9" r="2" {...common} /><path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M14 19c0-2 1-3.6 3-4" {...common} /></>,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold-dark" aria-hidden="true">
      {paths[kind]}
    </svg>
  );
}

const AUDIENCES = [
  { kind: 'school', name: 'Schools', blurb: 'Team, class, and event banners for the whole school.' },
  { kind: 'sports', name: 'Youth Sports', blurb: 'Celebrate every player and every season.' },
  { kind: 'highschool', name: 'High Schools', blurb: 'Senior night, varsity, and graduation moments.' },
  { kind: 'college', name: 'Colleges', blurb: 'Program pride, championships, and send-offs.' },
  { kind: 'booster', name: 'Booster Clubs', blurb: 'Fundraisers, game day, and team celebrations.' },
  { kind: 'families', name: 'Families', blurb: 'Graduations, milestones, and keepsakes at home.' },
];

export function PerfectFor() {
  return (
    <Section background="ivory" spacing="lg" aria-labelledby="perfect-for-heading">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">Perfect For</p>
        <h2 id="perfect-for-heading" className="mt-2 font-display text-3xl font-semibold text-obsidian sm:text-4xl">
          Made for the people who show up
        </h2>
      </div>
      <ul role="list" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {AUDIENCES.map((a) => (
          <li
            key={a.kind}
            className="flex flex-col items-center rounded-xl border border-obsidian/[0.08] bg-white p-5 text-center shadow-[0_2px_12px_-6px_rgba(12,14,20,0.14)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <AudienceIcon kind={a.kind} />
            </span>
            <h3 className="mt-3 font-sans text-sm font-semibold text-obsidian">{a.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-obsidian/55">{a.blurb}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
