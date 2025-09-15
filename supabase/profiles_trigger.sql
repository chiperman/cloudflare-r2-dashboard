-- Supabase 用户档案和触发器设置
--
-- 此脚本创建一个公共 `profiles` 表来存储用户显示名称，
-- 并设置触发器以自动将其与 `auth.users` 表同步。
-- 这是安全访问用户元数据的推荐方式。
--
-- 在运行 `schema.sql` 之后，在 Supabase SQL 编辑器中运行此脚本。

-- 1. 创建一个公开的 `profiles` 表，用于存放非敏感的用户信息
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT
);

COMMENT ON TABLE public.profiles IS '每个用户的公开个人资料信息。';
COMMENT ON COLUMN public.profiles.id IS '引用内部 Supabase 认证用户。';

-- 2. 为 `profiles` 表设置行级安全 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 允许任何登录的用户读取所有的公开 profiles
CREATE POLICY "Public profiles are viewable by authenticated users."
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 允许用户创建自己的 profile
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的 profile
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. 创建一个数据库函数，用于将 auth.users 的数据同步到 public.profiles
-- 这个函数会在用户注册或信息更新时被自动调用
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- 以安全定义者权限运行，可以访问 auth schema
AS $$
BEGIN
  -- 当 auth.users 表发生 INSERT (新用户注册)
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (id, display_name, email)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'display_name',
      new.email
    );
  -- 当 auth.users 表发生 UPDATE (用户信息更新)
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.profiles
    SET
      display_name = new.raw_user_meta_data->>'display_name',
      email = new.email
    WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$;

-- 4. 创建触发器，在 auth.users 表发生变化时调用上面的函数
-- 策略 1: 新用户注册时触发
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth();

-- 策略 2: 用户信息更新时触发
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth();

-- 5. (重要) 将已经存在的用户数据从 auth.users 回填到新的 profiles 表
INSERT INTO public.profiles (id, display_name, email)
SELECT
  id,
  raw_user_meta_data->>'display_name',
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING; -- 如果记录已存在则忽略，避免重复执行时报错
