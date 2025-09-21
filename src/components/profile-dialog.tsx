'use client';

import { User as UserIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ProfileSettings from '@/components/profile-settings';
import type { User } from '@supabase/supabase-js';

interface ProfileDialogProps {
  user: User;
}

export function ProfileDialog({ user }: ProfileDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <div className="hidden sm:block">
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
            <ProfileSettings user={user} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="sm:hidden">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>编辑个人资料</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <ProfileSettings user={user} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
