import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. レスポンスの初期化
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Supabaseクライアントの初期化 (セッション維持用)
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

  // セッションを更新（ログイン状態を維持するために必要）
  await supabase.auth.getUser()

  // 3. 📍 独自ドメインによる振り分けロジック
  const url = request.nextUrl
  const hostname = request.headers.get('host')

  // お客様用ドメイン (member.karinto-kcm.com)
  if (hostname?.includes('member.karinto-kcm.com')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/user/login', request.url))
    }
  }

  // キャスト用ドメイン (cast.karinto-kcm.com)
  if (hostname?.includes('cast.karinto-kcm.com')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 下記以外のすべてのパスにミドルウェアを適用:
     * - api (APIルート)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico (アイコン)
     * - 画像ファイル等
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}