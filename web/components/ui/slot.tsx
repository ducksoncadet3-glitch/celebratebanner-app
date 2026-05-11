import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimal Radix-style Slot — clones the single child element and merges
 * className. Used by Button asChild so we don't ship the whole Radix runtime.
 */
export function Slot({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & Record<string, unknown>) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  const childEl = child as ReactElement<{ className?: string; [k: string]: unknown }>;
  return cloneElement(childEl, {
    ...rest,
    ...childEl.props,
    className: cn(className, childEl.props.className),
  });
}
