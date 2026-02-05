import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "API root is alive!",
    env_check: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING",
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING"
    }
  });
}