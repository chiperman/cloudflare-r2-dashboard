"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SignUpForm } from "@/components/sign-up-form";
import { useState } from "react";

interface SignUpDialogProps {
  children: React.ReactNode;
  onSignUpSuccess?: () => void;
}

export function SignUpDialog({ children, onSignUpSuccess }: SignUpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSignUpSuccess = () => {
    setIsOpen(false);
    onSignUpSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>注册</DialogTitle>
        </DialogHeader>
        <SignUpForm onSignUpSuccess={handleSignUpSuccess} />
      </DialogContent>
    </Dialog>
  );
}
