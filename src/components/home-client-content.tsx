'use client';

import { useState } from 'react';
import { useCurrentUserProfile } from '@/hooks/use-current-user-profile';

import { FileList } from '@/features/r2/components/file-list';
import { FileListSkeleton } from '@/features/r2/components/file-list-skeleton';
import { UploadFormSkeleton } from '@/features/r2/components/upload-form-skeleton';
import { R2Metrics } from '@/features/r2/components/r2-metrics';
import dynamic from 'next/dynamic';

const DynamicUploadForm = dynamic(
  () => import('@/features/r2/components/upload-form').then((mod) => mod.UploadForm),
  {
    ssr: false,
    loading: () => <UploadFormSkeleton />,
  }
);
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="flex flex-row items-center gap-4 p-6">
        <Skeleton className="h-[70px] w-[70px] rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function R2MetricsSkeleton() {
  return (
    <Accordion type="single" collapsible className="w-full mb-4" defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <Skeleton className="h-6 w-32" />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 md:grid-cols-3 pt-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// The main skeleton component for the whole page
function HomeClientContentSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <R2MetricsSkeleton />
      <UploadFormSkeleton />
      <FileListSkeleton />
    </div>
  );
}

export function HomeClientContent() {
  const { user, profile, loading } = useCurrentUserProfile();
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [uploadVersion, setUploadVersion] = useState(0);

  if (loading) {
    return <HomeClientContentSkeleton />;
  }

  if (!user) {
    // This case should ideally not be reached if rendered by page.tsx
    return <div className="text-center p-8 text-destructive">未授权访问</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <R2Metrics />
      <DynamicUploadForm
        currentPrefix={currentPrefix}
        onUploadSuccess={(newFiles) => {
          if (newFiles.length > 0) {
            setUploadVersion((prev) => prev + 1);
          }
        }}
      />
      <FileList
        user={user}
        profile={profile}
        uploadVersion={uploadVersion}
        currentPrefix={currentPrefix}
        setCurrentPrefix={setCurrentPrefix}
      />
    </div>
  );
}
