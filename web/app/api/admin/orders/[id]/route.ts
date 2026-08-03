import { NextResponse } from 'next/server';
import { getOrderStore } from '@/lib/orders/store';
import { isAuthorized } from '@/lib/orders/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/orders/:id — full order detail incl. event timeline. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const order = await getOrderStore().get(id);
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ order });
}
