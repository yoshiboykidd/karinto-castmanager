import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 1. 未ログイン時のガード
  if (!user) {
    if (!path.startsWith("/login") && !path.startsWith("/auth") && !path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // 2. ログイン済みの場合の振り分け
  const loginId = user.email?.split('@')[0] || '';
  const { data: member } = await supabase
    .from('cast_members')
    .select('role')
    .eq('login_id', loginId)
    .single();

  const role = member?.role;

  // 👑 管理者 (admin/developer) の場合
  if (role === 'admin' || role === 'developer') {
    // 管理者が「/」や「/login」にいたら管理画面(/admin)へ強制移動
    if (path === '/' || path === '/login') {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  } 
  // 👗 キャストの場合
  else if (role === 'cast') {
    // キャストが「/admin」や「/login」にいたらトップ(/)へ強制移動
    if (path.startsWith('/admin') || path === '/login') {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};