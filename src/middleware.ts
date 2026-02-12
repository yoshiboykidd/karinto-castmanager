import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

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

  // 1. ユーザー情報を取得
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // --- 📝 ここからカンニングペーパー（ログ出力） ---
  console.log("-----------------------------------------");
  console.log("🔍 [Middleware実行中] アクセス先:", path);
  
  if (user) {
    const loginId = user.email?.split('@')[0] || '';
    
    // データベースから役職を取得してみる
    const { data: member, error: dbError } = await supabase
      .from('cast_members')
      .select('role, display_name')
      .eq('login_id', loginId)
      .single();

    console.log("👤 ログインユーザーID:", loginId);
    console.log("🔑 取得された役職 (ROLE):", member?.role || "取得失敗(null)");
    console.log("📛 取得された名前:", member?.display_name || "取得失敗(null)");

    if (dbError) {
      console.log("❌ DBエラー発生:", dbError.message);
      console.log("💡 ヒント: RLS（ポリシー）が原因でデータを読み取れていない可能性が高いです。");
    }

    // --- 🧭 交通整理ロジック ---

    // A. ログイン済みでログイン画面にいる場合
    if (path.startsWith("/login")) {
      const dest = (member?.role === 'admin' || member?.role === 'developer') ? '/admin' : '/';
      console.log("🚀 ログイン済みのため自動移動 ->", dest);
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // B. 管理者じゃないのに管理画面 (/admin) に入ろうとした場合
    if (path.startsWith("/admin") && member?.role !== 'admin' && member?.role !== 'developer') {
      console.log("🚫 管理者権限がないため、キャストページへ強制送還");
      return NextResponse.redirect(new URL("/", request.url));
    }

  } else {
    console.log("👤 状態: 未ログイン");
    // 未ログインで保護ページへ行こうとした場合
    if (!path.startsWith("/login") && !path.startsWith("/auth") && !path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
      console.log("🔒 未ログインのためログイン画面へリダイレクト");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  console.log("-----------------------------------------");

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};