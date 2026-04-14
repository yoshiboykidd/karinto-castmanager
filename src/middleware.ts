import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host')

  // 1. お客様用ドメイン (member.karinto-kcm.com) の場合
  if (hostname?.includes('member.karinto-kcm.com')) {
    // トップページ (/) に来たら、お客様ログイン画面へ
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/user/login', request.url))
    }
  }

  // 2. キャスト用ドメイン (cast.karinto-kcm.com) の場合
  if (hostname?.includes('cast.karinto-kcm.com')) {
    // トップページ (/) に来たら、キャスト用ログイン画面へ
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}