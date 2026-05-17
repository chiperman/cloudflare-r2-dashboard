'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { fetchUserProfile } from '@/lib/profile';
import type { UserProfileSummary } from '@/lib/types';

export function useCurrentUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      setLoading(true);
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);
      setProfile(currentUser ? await fetchUserProfile(supabase, currentUser) : null);
      setLoading(false);
    };

    void load();
  }, []);

  return {
    user,
    profile,
    loading,
  };
}
