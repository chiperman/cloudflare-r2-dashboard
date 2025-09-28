"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileList } from '@/components/r2/file-list';
import { UploadForm } from '@/components/r2/upload-form';
import { R2Metrics } from '@/components/r2/r2-metrics';
import { EnvVarWarning } from '@/components/env-var-warning';

interface UserProfile {
  id: string;
  role: string;
  // Add other profile fields if needed
}

export function HomeClientContent() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<any[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');

  useEffect(() => {
    const getUserAndProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
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
    return <div className="text-center p-8">加载中...</div>;
  }

  if (!user) {
    // This case should ideally not be reached if rendered by page.tsx
    return <div className="text-center p-8 text-destructive">未授权访问</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <EnvVarWarning />
      <R2Metrics />
      <UploadForm
        currentPrefix={currentPrefix}
        onUploadSuccess={(newFile) => {
          setNewlyUploadedFiles((prev) => [...prev, newFile]);
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
