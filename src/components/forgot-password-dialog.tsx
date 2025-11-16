'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
  isMobile?: boolean;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
  isMobile,
}: ForgotPasswordDialogProps) {
  const form = <ForgotPasswordForm onSwitchToLogin={onSwitchToLogin} />;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>忘记密码</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">{form}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>忘记密码</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
