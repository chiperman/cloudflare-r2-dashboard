'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  // return <Button onClick={logout}>退出</Button>;
  return (
    <Button size="sm" variant="default" onClick={logout}>
      退出
    </Button>
  );
}
