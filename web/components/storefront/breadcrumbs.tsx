import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

/** Accessible breadcrumb trail. The current page is the last crumb (no href). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-obsidian/55">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link href={c.href} className="hover:text-gold-dark hover:underline underline-offset-2">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-obsidian' : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden="true" className="text-obsidian/30">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
