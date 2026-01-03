import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';

const formSchema = z
  .object({
    currentPassword: z.string().min(1, { message: '请输入当前密码' }),
    newPassword: z.string().min(6, { message: '新密码必须至少包含6个字符' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
  });

async function updatePassword(values: z.infer<typeof formSchema>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: '用户未登录或邮箱不存在' };
  }

  // 验证当前密码
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: values.currentPassword,
  });

  if (signInError) {
    return { error: '当前密码不正确' };
  }

  // 检查新旧密码是否相同
  if (values.currentPassword === values.newPassword) {
    return { error: '新密码不能与当前密码相同' };
  }

  // 更新为新密码
  const { error: updateError } = await supabase.auth.updateUser({
    password: values.newPassword,
  });

  if (updateError) {
    // Supabase 可能会返回更具体的错误，但为了用户体验，我们返回一个通用消息
    return { error: '密码更新失败，请稍后重试' };
  }

  return { error: null };
}

export default function UpdatePasswordForm({
  className,
  onSuccess,
}: React.ComponentPropsWithoutRef<'div'> & { onSuccess?: () => void }) {
  const { toast } = useToast();
  const supabase = createClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await updatePassword(values);

    if (error) {
      if (error === '当前密码不正确') {
        form.setError('currentPassword', {
          type: 'manual',
          message: error,
        });
      } else if (error === '新密码不能与当前密码相同') {
        form.setError('newPassword', {
          type: 'manual',
          message: error,
        });
      } else {
        toast({
          variant: 'destructive',
          title: '错误',
          description: error,
        });
      }
    } else {
      toast({
        title: '成功',
        description: '密码已成功更新，请使用新密码重新登录。',
      });
      onSuccess?.();
      await supabase.auth.signOut();
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="border-0 sm:border">
        <CardHeader className="hidden sm:block">
          <CardTitle className="text-2xl">更新密码</CardTitle>
          <CardDescription>为了您的账户安全，我们建议您定期更新密码。</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>当前密码</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="请输入当前密码"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新密码</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="请输入新密码"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
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
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="请再次输入新密码"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? '更新中...' : '确认更新'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
