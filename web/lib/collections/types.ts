import type { ComponentProps } from 'react';
import type { Badge } from '@/components/ui/badge';

/** Shared shapes for collection pages. Reused by every future collection, not just football. */

export type ProductFormat = 'Printed' | 'Digital' | 'Both';

export interface CollectionProduct {
  id: string;
  title: string;
  description: string;
  format: ProductFormat;
  /** Image URL (or data-URI). */
  image: string;
  imageAlt: string;
  href: string;
  badge?: { label: string; variant?: ComponentProps<typeof Badge>['variant'] };
}

export interface CollectionPackage {
  id: string;
  name: string;
  tagline: string;
  /** Free-form availability line — never a hardcoded price. */
  note: string;
  features: string[];
  href: string;
  ctaLabel?: string;
  popular?: boolean;
}

export interface TrustFeature {
  /** Emoji or short glyph, rendered decoratively. */
  icon: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface CollectionHeroContent {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  primaryCTA: { href: string; label: string };
  secondaryCTA?: { href: string; label: string };
}

export interface CollectionData {
  slug: string;
  seo: { title: string; description: string; path: string; ogImage?: string };
  hero: CollectionHeroContent;
  intro: { eyebrow: string; heading: string; body: string };
  products: CollectionProduct[];
  packages: CollectionPackage[];
  process: ProcessStep[];
  trust: TrustFeature[];
  faqs: FaqItem[];
  finalCta: { heading: string; body: string; cta: { href: string; label: string } };
}
