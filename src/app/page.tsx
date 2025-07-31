import { createClient } from '@/lib/supabase/server';
;
import { EnvVarWarning } from '@/components/env-var-warning';
import { AuthButton } from '@/components/auth-button';

import { hasEnvVars } from '@/lib/utils';
import Link from 'next/link';

import { HomeClientContent } from '@/components/home-client-content';

export default async function Home() {
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={'/'}>Cloudflare R2 Dashboard</Link>
            </div>
            <div className="flex items-center gap-3">
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-10 max-w-5xl w-full p-5 items-center">
          {user ? (
            <HomeClientContent />
          ) : (
            <section className="flex flex-col items-center gap-6 mt-16 text-center">
              <h1 className="text-5xl font-bold">管理您的 Cloudflare R2 文件</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                在您的 Cloudflare R2 存储中上传、查看和管理文件。登录以开始使用。
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
        </footer>
      </div>
    </main>
  );
}

