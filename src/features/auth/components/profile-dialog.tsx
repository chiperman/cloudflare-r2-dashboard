'use client';

import { User as UserIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ProfileSettings from './profile-settings';
import type { User } from '@supabase/supabase-js';

interface ProfileDialogProps {
  user: User;
}

export function ProfileDialog({ user }: ProfileDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserIcon className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑个人资料</DialogTitle>
        </DialogHeader>
        <div className="p-0 sm:p-0">
          <ProfileSettings user={user} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
