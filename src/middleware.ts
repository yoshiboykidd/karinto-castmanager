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
  if (!user && !path.startsWith("/login") && !path.startsWith("/auth") && !path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. ログイン済みの振り分け
  if (user) {
    const loginId = user.email?.split('@')[0] || '';
    const { data: member } = await supabase
      .from('cast_members')
      .select('role')
      .eq('login_id', loginId)
      .single();

    const role = member?.role;
    const isAdmin = role === 'admin' || role === 'developer';

    // 管理者がキャストページやログイン画面にいたら、管理画面へ強制移動
    if (isAdmin && (path === "/" || path === "/login")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // ログイン済みでログイン画面にいたら、適切なトップへ移動
    if (path === "/login") {
      return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};