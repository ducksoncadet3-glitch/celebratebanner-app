import { CreateFlow } from '@/components/create-flow';
import { Container } from '@/components/ui/container';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Create your product',
  description:
    'Upload your photos, personalize your design, and preview your custom product in real time.',
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
          <h1 className="mt-2 text-balance text-4xl sm:text-5xl">Design your product</h1>
          <p className="mt-3 max-w-2xl text-obsidian/70">
            Upload your photos, personalize your design, and we&apos;ll help you create the
            rest. You only pay when you&apos;re ready to download or order.
          </p>
        </header>
        <CreateFlow />
      </Container>
    </div>
  );
}
