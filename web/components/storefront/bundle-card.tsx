import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getBundleProducts, bundleImage, bundleProofHref, type Bundle } from '@/lib/catalog/bundles';

/**
 * Featured bundle card: what's included (linked real products), starting price (sum of the
 * included products), and a "Build This Package" CTA that opens the EXISTING proof flow
 * preselected to the lead product. No fabricated bundle discount is shown.
 */
export function BundleCard({ bundle }: { bundle: Bundle }) {
  const products = getBundleProducts(bundle);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-obsidian/[0.08] bg-white shadow-[0_2px_12px_-6px_rgba(12,14,20,0.14)]">
      <div className="flex items-center justify-center bg-obsidian p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bundleImage(bundle)} alt={`${bundle.name} — sample design (placeholder)`} loading="lazy" decoding="async" className="h-auto w-full rounded-lg object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-semibold text-obsidian">{bundle.name}</h3>
        <p className="mt-1 text-sm text-obsidian/60">{bundle.tagline}</p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gold-dark">What&apos;s included</p>
        <ul role="list" className="mt-2 space-y-1.5">
          {products.map((p) => (
            <li key={p.slug} className="flex items-start gap-2 text-sm text-obsidian/75">
              <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/15 text-xs text-sage">✓</span>
              <Link href={`/products/${p.slug}`} className="hover:text-gold-dark hover:underline underline-offset-2">
                {p.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-obsidian/8 pt-4">
          <p className="text-sm text-obsidian/70">
            Each product is personalized and priced individually at checkout — printed from
            $79.99, digital from $9.99.
          </p>
        </div>

        <div className="mt-5 mt-auto pt-5">
          <Button asChild variant="gold" fullWidth>
            <Link href={bundleProofHref(bundle)}>Build This Package</Link>
          </Button>
          <p className="mt-2 text-center text-xs text-obsidian/55">Start your free design proof — no payment required.</p>
        </div>
      </div>
    </article>
  );
}
