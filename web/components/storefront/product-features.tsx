export function ProductFeatures({ features }: { features: string[] }) {
  return (
    <ul role="list" className="grid gap-2.5 sm:grid-cols-2">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-obsidian/75">
          <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/15 text-xs text-sage">
            ✓
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}
