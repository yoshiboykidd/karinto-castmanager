import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. レスポンスの初期化
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Supabaseクライアントの初期化
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 📍 ログインユーザーの情報を取得（判定に使用）
  const { data: { user } } = await supabase.auth.getUser()

  // 3. ドメイン・振り分けロジック
  const url = request.nextUrl
  const hostname = request.headers.get('host')

  // --- 【A】お客様用ドメイン (kcm-member.jp などの新ドメインを想定) ---
  // 📍 karinto-kcm.com から KCM 系のキーワードを含む判定に変更
  if (hostname?.includes('member') && hostname?.includes('kcm')) {
    if (url.pathname === '/') {
      // ログイン済みならダッシュボードへ、未ログインならログイン画面へ
      const target = user ? '/user/dashboard' : '/user/login'
      return NextResponse.rewrite(new URL(target, request.url))
    }
  }

  // --- 【B】キャスト用、Vercel用、ローカル環境 ---
  if (
    hostname?.includes('cast') || 
    hostname?.includes('vercel.app') ||
    hostname?.includes('localhost') ||
    hostname?.includes('kcm-portal') // 新しいドメインに合わせて追加
  ) {
    if (url.pathname === '/') {
      // 📍 ここが重要：ログイン済みの場合は、/login に書き換えずそのまま進ませる
      if (user) {
        return response
      }
      return NextResponse.rewrite(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}