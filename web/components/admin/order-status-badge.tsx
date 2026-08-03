import { Badge } from '@/components/ui/badge';
import { ORDER_STATES } from '@/lib/orders/lifecycle';
import type { OrderStatus } from '@/lib/orders/types';

const TONE_TO_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'featured'> = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  featured: 'featured',
};

/** Renders an order status as a brand Badge (neutral states get a plain gray chip). */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATES[status];
  if (!meta || meta.tone === 'neutral') {
    return (
      <span className="inline-flex items-center rounded-full bg-obsidian/8 px-3 py-1 text-xs font-semibold tracking-wide text-obsidian/60">
        {meta?.label ?? status}
      </span>
    );
  }
  return <Badge variant={TONE_TO_VARIANT[meta.tone]}>{meta.label}</Badge>;
}
