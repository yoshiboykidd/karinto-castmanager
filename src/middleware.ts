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

  // 1. 未ログインならログイン画面へ
  if (!user && !path.startsWith("/login") && !path.startsWith("/auth") && !path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. ログイン済みなら、権限を見て振り分ける
  if (user && (path.startsWith("/login") || path === "/")) {
    const loginId = user.email?.split('@')[0] || '';
    
    // DBからroleを確認
    const { data: member } = await supabase
      .from('cast_members')
      .select('role')
      .eq('login_id', loginId)
      .single();

    const role = member?.role;

    // 管理者なら /admin へ、キャストなら / へ (ループ防止のため現在のパスと違う場合のみ)
    if ((role === 'admin' || role === 'developer') && !path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === 'cast' && path !== "/") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};