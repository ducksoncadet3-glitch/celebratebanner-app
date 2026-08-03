import { NextResponse } from 'next/server';
import { getOrderStore } from '@/lib/orders/store';
import { isAuthorized } from '@/lib/orders/admin-auth';
import { ORDER_STATES } from '@/lib/orders/lifecycle';
import type { OrderStatus } from '@/lib/orders/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/orders?q=&status= — search + status-filtered order list. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? undefined;
  const statusRaw = url.searchParams.get('status') ?? undefined;
  const status = statusRaw && statusRaw in ORDER_STATES ? (statusRaw as OrderStatus) : undefined;

  const orders = await getOrderStore().list({ q, status });
  return NextResponse.json({ orders });
}
