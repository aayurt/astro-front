type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-3 w-48 mb-2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 7 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === 0 ? 'w-16' : i === columns - 1 ? 'w-6' : 'flex-1'}`}
        />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChatBubbleSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-start gap-2">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-16" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="w-full max-w-[400px] aspect-square rounded-lg" />
    </div>
  );
}

export function BadgeSkeleton() {
  return <Skeleton className="h-5 w-16 rounded-full" />;
}
