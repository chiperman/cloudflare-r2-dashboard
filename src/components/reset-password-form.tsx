
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const formSchema = z
  .object({
    password: z.string().min(6, { message: '新密码必须至少包含6个字符' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
  });

export default function ResetPasswordForm({
  className,
}: React.ComponentPropsWithoutRef<'div'>) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });



  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setError(error.message);
      toast({
        variant: 'destructive',
        title: '错误',
        description: `密码重置失败: ${error.message}`,
      });
    } else {
      setSuccess(true);
      toast({
        title: '成功',
        description: '您的密码已成功重置，请使用新密码登录。',
      });
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/'); // Adjust this to your login page route if different
      }, 3000);
    }
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">密码重置成功</CardTitle>
          <CardDescription>您现在将被重定向到登录页面。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">设置您的新密码</CardTitle>
          <CardDescription>请输入您的新密码。</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请输入新密码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>确认新密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请再次输入新密码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? '重置中...' : '确认重置密码'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
