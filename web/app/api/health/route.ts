import { NextResponse } from 'next/server';

// Liveness probe for Fly health checks. Cheap, no dependencies, always 200 if the
// Node server is up. Kept out of the customer-facing surface.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'web' });
}
