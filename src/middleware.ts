import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isInternal = pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon');

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() to verify the session authenticity and satisfy Supabase warnings
  const { data: { user } } = await supabase.auth.getUser();

  // To get the AMR (Authentication Method Reference) reliably, we inspect the JWT claims directly.
  // This is necessary because app_metadata may not always reflect the instantaneous auth context.
  let isRecoveryMode = false;
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (accessToken) {
    try {
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const amr = payload.amr || [];
      isRecoveryMode = Array.isArray(amr) && amr.some((item: any) => {
        if (typeof item === 'string') return item === 'recovery';
        if (item && typeof item === 'object') return item.method === 'recovery';
        return false;
      });
    } catch (e) {
      // Silent fail, fallback to normal flow
    }
  }

  // 1. Handle recovery mode restriction: Force users to finish password reset
  if (isRecoveryMode) {
    if (pathname !== '/auth/reset-password') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/reset-password';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 2. Prevent normal users from accessing reset-password directly (without a code)
  if (!isRecoveryMode && pathname === '/auth/reset-password') {
    const hasRecoveryCode = request.nextUrl.searchParams.has('code');
    if (!hasRecoveryCode) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // 3. Navigation protection for unauthenticated users
  if (
    pathname !== '/' &&
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
