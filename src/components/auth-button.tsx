'use client';

import { Button } from './ui/button';
import { createClient } from '@/lib/supabase/client';
import { LogoutButton } from './logout-button';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { LoginDialog } from './login-dialog';
import { SignUpDialog } from './sign-up-dialog';

export function AuthButton() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, [supabase.auth]);

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.user_metadata.display_name || user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <LoginDialog>
        <Button size="sm" variant={"outline"}>
          Sign in
        </Button>
      </LoginDialog>
      <SignUpDialog>
        <Button size="sm" variant={"default"}>
          Sign up
        </Button>
      </SignUpDialog>
    </div>
  );
}
