import { NextResponse } from 'next/server'

// 門番を一旦お休みさせます。これでリダイレクトのループが止まります。
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: [], // 何も監視しない
}