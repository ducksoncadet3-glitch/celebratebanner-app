import { CreateFlow } from '@/components/create-flow';
import { Container } from '@/components/ui/container';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Create your banner',
  description:
    'Upload up to 50 photos, choose a theme, and preview your custom banner in real time.',
  path: '/create',
});

export default function CreatePage() {
  return (
    <div className="bg-ivory py-12 sm:py-16">
      <Container>
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
            Step 1 of 3
          </p>
          <h1 className="mt-2 text-balance text-4xl sm:text-5xl">Design your banner</h1>
          <p className="mt-3 max-w-2xl text-obsidian/70">
            Upload your photos, pick a hero, and we&apos;ll lay out the rest. You only pay
            when you&apos;re ready to download — no account required.
          </p>
        </header>
        <CreateFlow />
      </Container>
    </div>
  );
}
