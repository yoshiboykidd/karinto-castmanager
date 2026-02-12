// middleware.ts を一旦空にする
import { NextResponse } from 'next/server'
export function middleware() {
  return NextResponse.next()
}
export const config = { matcher: [] }