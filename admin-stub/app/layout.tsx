import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'CelebrateBanner Admin',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/',         label: 'Overview' },
  { href: '/projects', label: 'Projects' },
  { href: '/queue',    label: 'Queue' },
  { href: '/payments', label: 'Payments' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900">
        <div className="grid min-h-screen grid-cols-[240px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-900 p-5 text-slate-200">
            <Link href="/" className="font-display text-xl">
              Celebrate<em className="not-italic text-amber-300">Banner</em>
              <span className="ml-2 rounded bg-amber-300/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                admin
              </span>
            </Link>
            <nav className="mt-8 space-y-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-slate-800"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <p className="mt-12 text-[10px] text-slate-500">
              All actions here are audit-logged. Refunds + re-renders are irreversible.
            </p>
          </aside>
          <main className="p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
