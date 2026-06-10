import ProfileSettings from '@/features/auth/components/profile-settings';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <ProfileSettings user={user} />
    </div>
  );
}
