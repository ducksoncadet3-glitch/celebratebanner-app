const SAMPLES = [
  { theme: 'Graduation', name: 'Sarah · Class of 2026', tone: 'from-obsidian via-obsidian-50 to-obsidian-100', accent: 'text-gold-pale' },
  { theme: 'Wedding',    name: 'Maya & Daniel · June 14',  tone: 'from-rose/30 via-ivory to-white',                accent: 'text-rose' },
  { theme: 'Anniversary',name: '25 Years · Lopez Family',  tone: 'from-obsidian via-obsidian-100 to-obsidian',     accent: 'text-gold' },
  { theme: 'Champions',  name: 'Eagles 2026 · State Champs', tone: 'from-sky/40 via-white to-ivory',              accent: 'text-sky' },
  { theme: 'Pets',       name: 'Best floofs of 2026',      tone: 'from-gold/15 via-ivory to-white',                accent: 'text-gold-dark' },
  { theme: 'Family Reunion',name: 'The Lopez Family · 2026', tone: 'from-obsidian via-obsidian-50 to-obsidian',  accent: 'text-gold' },
];

export function GalleryGrid() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLES.map((s) => (
        <li key={s.name}>
          <article className="group overflow-hidden rounded-2xl border border-gold/15 bg-white shadow-lift transition hover:-translate-y-1 hover:shadow-gold">
            <div className={`aspect-[2/3] bg-gradient-to-br ${s.tone} relative`}>
              <div className="absolute inset-x-0 top-0 p-6 text-center">
                <p className={`font-display text-2xl sm:text-3xl ${s.accent}`}>{s.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gold/70">{s.theme}</p>
              </div>
              <div className="absolute inset-x-6 bottom-6 grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded shimmer" />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gold/15 px-4 py-3 text-xs text-obsidian/70">
              <span>24×36″ · 300 DPI</span>
              <span className="text-gold-dark">CelebrateBanner</span>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
