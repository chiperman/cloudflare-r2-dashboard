'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function UploadFormSkeleton() {
  return (
    <div className="w-full mx-auto mb-8 space-y-6">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
