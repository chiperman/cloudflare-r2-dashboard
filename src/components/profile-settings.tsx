'use client';

import UpdatePasswordForm from '@/components/update-password-form';
import UpdateDisplayNameForm from '@/components/update-display-name-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function ProfileSettings() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    getUser();
  }, [supabase.auth]);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>个人资料</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <UpdatePasswordForm />
        </div>
        <div>
          <UpdateDisplayNameForm
            initialDisplayName={
              user.user_metadata.display_name || user.user_metadata.username
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
