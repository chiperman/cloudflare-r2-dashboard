'use client';

import { UserRoundPen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ProfileSettings from '@/components/profile-settings';

export function ProfileDialog() {
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
        <ProfileSettings />
      </DialogContent>
    </Dialog>
  );
}
