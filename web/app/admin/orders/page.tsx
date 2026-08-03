import { Container } from '@/components/ui/container';
import { OrderQueue } from '@/components/admin/order-queue';
import { getOrderStore } from '@/lib/orders/store';
import { adminTokenConfigured, isKeyAuthorized } from '@/lib/orders/admin-auth';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Order queue',
  description: 'Internal order operations queue.',
  path: '/admin/orders',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const secured = adminTokenConfigured();
  const authorized = isKeyAuthorized(key);

  return (
    <div className="bg-ivory py-10 sm:py-14">
      <Container width="wide">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">Operations</p>
          <h1 className="mt-2 text-balance text-3xl sm:text-4xl">Order queue</h1>
        </header>

        {!authorized ? (
          <div className="mx-auto max-w-md rounded-2xl border border-gold/30 bg-white p-8 shadow-lift">
            <h2 className="text-xl">Admin access required</h2>
            <p className="mt-2 text-sm text-obsidian/65">Enter your admin token to continue.</p>
            <form method="get" className="mt-4 flex gap-2">
              <label htmlFor="key" className="sr-only">Admin token</label>
              <input
                id="key"
                name="key"
                type="password"
                required
                className="w-full rounded-lg border border-obsidian/15 bg-white px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                placeholder="Admin token"
              />
              <button
                type="submit"
                className="rounded-full bg-gradient-to-br from-gold to-gold-light px-5 py-2.5 text-sm font-semibold text-obsidian"
              >
                Enter
              </button>
            </form>
          </div>
        ) : (
          <>
            {!secured && (
              <div className="mb-5 rounded-xl border border-rose/30 bg-rose/5 p-4 text-sm text-rose">
                <strong>Unsecured:</strong> <code>ADMIN_API_TOKEN</code> is not set, so this queue is open. Set it
                before deploying.
              </div>
            )}
            <OrderQueueLoader token={secured ? (key ?? '') : ''} />
          </>
        )}
      </Container>
    </div>
  );
}

/** Loads full orders (incl. event timeline) from the store and renders the client queue. */
async function OrderQueueLoader({ token }: { token: string }) {
  const store = getOrderStore();
  const summaries = await store.list();
  const orders = (await Promise.all(summaries.map((s) => store.get(s.id)))).filter(
    (o): o is NonNullable<typeof o> => o !== null,
  );
  return <OrderQueue initialOrders={orders} token={token} />;
}
