import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 重要: getUser() を呼ぶことでセッションをリフレッシュする
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 現在のパス
  const path = request.nextUrl.pathname;

  // ▼▼▼ 交通整理ルール ▼▼▼

  // 1. ログインしていないのに、保護されたページに行こうとしたら弾く
  // (login, auth, 画像ファイル 以外はすべて保護)
  if (!user && !path.startsWith("/login") && !path.startsWith("/auth") && !path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. すでにログインしているのに、ログイン画面に来たらホームへ返す
  if (user && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * すべてのリクエストパスにマッチさせますが、以下は除外します:
     * - api (APIルート)  <-- ★これを追加したことになります
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - 画像ファイル
     */
    // ▼▼▼ 修正箇所: 先頭に「api|」を追加 ▼▼▼
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};