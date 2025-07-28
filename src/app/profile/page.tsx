import ProfileSettings from '@/components/profile-settings';
import { createServerClient, CookieOptions, CookieMethodsServer } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        getAll: () => cookieStore.getAll(),
        set: (name: string, value: string, options: CookieOptions) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: CookieOptions) => cookieStore.set({ name, value: '', ...options }),
      } as CookieMethodsServer,
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <ProfileSettings user={user} />
    </div>
  );
}