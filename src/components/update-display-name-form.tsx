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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const formSchema = z
  .object({
    displayName: z
      .string()
      .min(2, { message: '昵称至少需要2个字符' })
      .max(30, { message: '昵称不能超过30个字符' }),
  });

// Props：initialDisplayName（用户当前的显示名称，可能为 null）
export default function UpdateDisplayNameForm({
  initialDisplayName,
  className,
  onSuccess,
}: {
  initialDisplayName: string | null;
  className?: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const supabase = createClient(); // 创建 Supabase 客户端

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: initialDisplayName || '',
    },
  });

  // 表单提交事件
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    form.clearErrors();
    
    // 检查用户是否已登录
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        variant: 'destructive',
        title: '错误',
        description: '用户未登录，请重新登录',
      });
      return;
    }

    // 检查昵称是否与当前昵称相同
    if (values.displayName === initialDisplayName) {
      form.setError('displayName', {
        type: 'manual',
        message: '昵称未发生改变，请输入不同的昵称',
      });
      return;
    }

    // 调用 Supabase API 更新用户元数据
    const { error } = await supabase.auth.updateUser({
      data: { display_name: values.displayName }, // 更新 display_name
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: '错误',
        description: `更新失败: ${error.message}`,
      });
    } else {
      toast({
        title: '成功',
        description: '昵称已成功更新！',
      });
      form.reset({ displayName: values.displayName });
      onSuccess?.();
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">修改昵称</CardTitle>
          <CardDescription>请输入新昵称</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>昵称</FormLabel>
                    <FormControl>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="New name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '更新中...' : '更新昵称'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}