import type { SupabaseClient, User } from '@supabase/supabase-js';
import { UserProfileSummary } from './types';

export async function fetchUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserProfileSummary | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}
