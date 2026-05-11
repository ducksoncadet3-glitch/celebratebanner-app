import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import Script from 'next/script';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { SITE } from '@/lib/seo';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} · Custom Celebration Banners`, template: `%s · ${SITE.name}` },
  description: SITE.defaultDescription,
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  authors: [{ name: 'CDN4 LLC', url: SITE.url }],
  keywords: [
    'celebration banner',
    'graduation banner',
    'wedding banner',
    'custom photo banner',
    'printed banner',
    'photo collage',
  ],
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0C0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-772-834-9060',
      email: 'info@celebratebanner.com',
      contactType: 'customer service',
    },
  };

  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-obsidian focus:px-4 focus:py-2 focus:text-gold"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
