const THEMES = [
  { id: 'graduation', name: 'Graduation', emoji: '🎓', sub: 'Up to 50 photos · stair collage' },
  { id: 'wedding', name: 'Wedding', emoji: '💍', sub: 'Couple names · soft palette' },
  { id: 'anniversary', name: 'Anniversary', emoji: '🥂', sub: 'Years · date · memories' },
  { id: 'champion', name: 'Champions', emoji: '🏆', sub: '10-photo team grid' },
  { id: 'pets', name: 'Pets', emoji: '🐾', sub: 'Best floofs of the year' },
  { id: 'milestone', name: 'Milestone', emoji: '✨', sub: 'Birthdays, retirements, more' },
];

export function ThemeGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {THEMES.map((t) => (
        <li key={t.id}>
          <article className="group h-full rounded-2xl border border-gold/20 bg-white p-6 transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-lift">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-2xl">
              <span aria-hidden>{t.emoji}</span>
            </div>
            <h3 className="mt-4 text-xl">{t.name}</h3>
            <p className="mt-1 text-sm text-obsidian/65">{t.sub}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}
