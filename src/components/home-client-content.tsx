'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { R2File } from '@/lib/types';

import { FileList, FileListSkeleton } from '@/components/r2/file-list';
import { UploadForm, UploadFormSkeleton } from '@/components/r2/upload-form';
import { R2Metrics } from '@/components/r2/r2-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserProfile {
  id: string;
  role: string;
}

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
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<R2File[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');

  useEffect(() => {
    const getUserAndProfile = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, role') // Select the role
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };
    getUserAndProfile();
  }, [supabase]);

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
      <UploadForm
        currentPrefix={currentPrefix}
        onUploadSuccess={(newFiles) => {
          setNewlyUploadedFiles((prev) => [...prev, ...newFiles]);
        }}
      />
      <FileList
        user={user}
        profile={profile}
        newlyUploadedFiles={newlyUploadedFiles}
        currentPrefix={currentPrefix}
        setCurrentPrefix={setCurrentPrefix}
      />
    </div>
  );
}
