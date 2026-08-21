import { cn } from "@/lib/utils"

/**
 * Loading placeholders shaped like the content they stand in for.
 *
 * The shadcn Skeleton defaults to `bg-muted`, which resolves to a 96%-lightness
 * grey — effectively invisible against this site's white and #F1EFEE surfaces.
 * These use an explicit tone so the pulse actually reads.
 *
 * Every skeleton is aria-hidden and the surrounding region should carry
 * aria-busy, so a screen reader announces "loading" once rather than reading
 * out a screenful of empty boxes.
 */

export function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-gray-200/80", className)}
    />
  )
}

/** Wraps a set of skeletons so assistive tech announces the region as busy. */
export function SkeletonRegion({
  label = "Loading",
  className,
  children,
}: {
  label?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}

/** Mirrors a cart line: thumbnail, title, price, variant, quantity stepper. */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 bg-white">
      <SkeletonBox className="w-24 h-32 flex-shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2 py-1">
        <div className="flex justify-between items-start gap-2">
          <SkeletonBox className="h-4 w-2/3" />
          <SkeletonBox className="h-8 w-8 rounded-full shrink-0" />
        </div>
        <SkeletonBox className="h-6 w-24" />
        <SkeletonBox className="h-3 w-40" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonBox className="h-8 w-28 rounded-full" />
          <SkeletonBox className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

/** Mirrors a shop/product grid card: image, name, price, colour swatches, button. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden bg-white">
      <SkeletonBox className="w-full aspect-[3/4] rounded-none" />
      <div className="py-3 space-y-2">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-5 w-20" />
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-4 w-12" />
          <SkeletonBox className="h-4 w-4 rounded-full" />
          <SkeletonBox className="h-4 w-4 rounded-full" />
        </div>
        <SkeletonBox className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}

/** Mirrors an admin list row: thumbnail, two lines, trailing actions. */
export function ListRowSkeleton({ withThumb = true }: { withThumb?: boolean }) {
  return (
    <div className="flex items-center gap-4 border border-gray-200 rounded-lg p-4 bg-white">
      {withThumb && <SkeletonBox className="h-14 w-14 rounded-md shrink-0" />}
      <div className="flex-1 space-y-2 min-w-0">
        <SkeletonBox className="h-4 w-1/2" />
        <SkeletonBox className="h-3 w-1/3" />
      </div>
      <SkeletonBox className="h-9 w-20 rounded-md shrink-0" />
    </div>
  )
}

/** Mirrors an order/return card: header line, meta row, then item lines. */
export function OrderCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="border-b border-gray-200 p-4 space-y-3">
        <div className="flex justify-between items-start gap-4">
          <SkeletonBox className="h-5 w-48" />
          <SkeletonBox className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex gap-4">
          <SkeletonBox className="h-3 w-28" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3">
            <SkeletonBox className="h-16 w-14 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-4 w-2/5" />
              <SkeletonBox className="h-3 w-1/4" />
            </div>
            <SkeletonBox className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Mirrors a dashboard stat tile: label, big number. */
export function StatCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-3">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-8 w-20" />
    </div>
  )
}

/** Repeats a skeleton n times. */
export function SkeletonList({
  count,
  className,
  children,
}: {
  count: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  )
}
