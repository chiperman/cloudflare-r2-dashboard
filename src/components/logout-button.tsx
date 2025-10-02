'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function LogoutButton({ onLogoutSuccess }: { onLogoutSuccess?: () => void }) {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onLogoutSuccess?.();
  };

  return (
    <Button size="sm" variant="default" onClick={logout}>
      退出
    </Button>
  );
}
