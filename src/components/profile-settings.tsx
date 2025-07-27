'use client';

import UpdatePasswordForm from '@/components/update-password-form';
import UpdateDisplayNameForm from '@/components/update-display-name-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@supabase/supabase-js';

interface ProfileSettingsProps {
  user: User;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  return (
        <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">账户</TabsTrigger>
        <TabsTrigger value="password">密码</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="mt-4">
        <UpdateDisplayNameForm
          initialDisplayName={user.user_metadata.display_name || user.user_metadata.username}
        />
      </TabsContent>
      <TabsContent value="password" className="mt-4">
        <UpdatePasswordForm />
      </TabsContent>
    </Tabs>
  );
}
