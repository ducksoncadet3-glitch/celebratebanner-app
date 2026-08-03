import { NextResponse } from 'next/server';
import { getOrderStore } from '@/lib/orders/store';
import { isAuthorized } from '@/lib/orders/admin-auth';
import { ORDER_STATES } from '@/lib/orders/lifecycle';
import { logOperationalEvent } from '@/lib/orders/events';
import type { OrderStatus } from '@/lib/orders/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  status?: unknown;
  note?: unknown;
  actor?: unknown;
}

/** POST /api/admin/orders/:id/status — lifecycle-validated status update. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const to = typeof body.status === 'string' ? body.status : '';
  if (!(to in ORDER_STATES)) {
    return NextResponse.json({ error: `unknown status "${to}"` }, { status: 400 });
  }
  const note = typeof body.note === 'string' ? body.note : undefined;
  const actor = typeof body.actor === 'string' && body.actor ? `admin:${body.actor}` : 'admin:unknown';

  try {
    const order = await getOrderStore().updateStatus(id, to as OrderStatus, actor, note);
    logOperationalEvent(
      { orderId: id, scope: 'status_change', message: `Admin set status to ${to}`, actor, metadata: { to } },
      'info',
    );
    return NextResponse.json({ order });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'NOT_FOUND') return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (code === 'ILLEGAL_TRANSITION' || code === 'INVALID_STATUS') {
      return NextResponse.json({ error: (err as Error).message }, { status: 409 });
    }
    logOperationalEvent(
      { orderId: id, scope: 'status_change', message: `Status update failed: ${(err as Error).message}`, actor },
      'error',
    );
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}
