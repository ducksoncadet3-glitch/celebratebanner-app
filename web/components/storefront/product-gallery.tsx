import { cn } from '@/lib/utils';

export interface ProductGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

/**
 * Product image display. Renders the primary image in a fixed-aspect frame (no layout
 * shift). If more than one image exists, additional images render as a static thumbnail
 * strip. Images are placeholders today (see lib/catalog/poster.ts).
 */
export function ProductGallery({ images, alt, className }: ProductGalleryProps) {
  const [primary, ...rest] = images;
  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-hidden rounded-xl border border-obsidian/[0.08] bg-obsidian p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primary}
          alt={alt}
          width={1600}
          height={1000}
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-lg object-cover"
        />
      </div>
      {rest.length > 0 && (
        <ul className="grid grid-cols-4 gap-3" aria-label="More images">
          {rest.map((src, i) => (
            <li key={i} className="overflow-hidden rounded-lg border border-obsidian/[0.08] bg-obsidian p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} — view ${i + 2}`} loading="lazy" decoding="async" className="h-auto w-full rounded object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
