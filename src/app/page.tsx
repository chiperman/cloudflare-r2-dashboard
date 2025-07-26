'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { EnvVarWarning } from '@/components/env-var-warning';
import { AuthButton } from '@/components/auth-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { hasEnvVars } from '@/lib/utils';
import Link from 'next/link';
import { FileList } from '@/components/r2/file-list';
import { UploadForm } from '@/components/r2/upload-form';

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    getUser();
  }, [supabase.auth]);

  const handleActionComplete = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={'/'}>Cloudflare R2 Dashboard</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-10 max-w-5xl w-full p-5 items-center">
          {user ? (
            <div className="w-full">
              <UploadForm onUploadSuccess={handleActionComplete} />
              <div className="mt-8">
                <FileList key={refreshKey} refreshTrigger={refreshKey} onActionComplete={handleActionComplete} />
              </div>
            </div>
          ) : (
            <section className="flex flex-col items-center gap-6 mt-16 text-center">
              <h1 className="text-5xl font-bold">Manage Your Cloudflare R2 Files</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Upload, view, and manage files in your Cloudflare R2 storage. Sign in to get started.
              </p>
            </section>
          )}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p>
            Powered by{' '}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}

