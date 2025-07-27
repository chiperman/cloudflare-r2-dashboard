'use client';

import { UserRoundPen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ProfileSettings from '@/components/profile-settings';
import type { User } from '@supabase/supabase-js';

interface ProfileDialogProps {
  user: User;
}

export function ProfileDialog({ user }: ProfileDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <UserRoundPen className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑个人资料</DialogTitle>
        </DialogHeader>
        <ProfileSettings user={user} />
      </DialogContent>
    </Dialog>
  );
}
