import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 日本時間への調整用
const JST_OFFSET = 9 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // 1. 【ここが修正ポイント】cookies() を await して resolved な状態にする
  const cookieStore = await cookies();

  // 2. Supabaseクライアントの初期化
  // cookieStore が解決済みなので、.get() の波線はこれで消えます
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Route Handler ではセットできないため、型定義を満たすための空関数
        set() {}, 
        remove() {},
      },
    }
  );

  console.log("🚀 同期開始 (Next.js 15+ 準拠)");

  try {
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(Date.now() + JST_OFFSET + i * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().split('T')[0];
      const hpDateStr = dateStr.replace(/-/g, '/');

      // HPからデータ取得
      const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}`, { 
        cache: 'no-store' 
      });
      const html = await hpRes.text();

      // 正規表現で解析
      const listItems = html.match(/<li>[\s\S]*?<\/li>/g) || [];

      for (const item of listItems) {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);

        if (!nameMatch || !timeMatch) continue;

        const hpName = nameMatch[1].replace(/（\d+）/g, '').trim();
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];

        // キャスト取得
        const { data: cast } = await supabase
          .from('cast_members')
          .select('login_id')
          .eq('hp_display_name', hpName)
          .single();

        if (!cast) continue;

        // 【三すくみ】現在のDB状態を確認
        const { data: existing } = await supabase
          .from('shifts')
          .select('status, is_official_pre_exist')
          .eq('login_id', cast.login_id)
          .eq('shift_date', dateStr)
          .single();

        const updateData: any = {
          login_id: cast.login_id,
          shift_date: dateStr,
          hp_display_name: hpName,
          is_official_pre_exist: true
        };

        // 申請中(requested)なら時間は触らず、HP情報を無視する
        if (existing?.status === 'requested') {
          console.log(`⚠️ ${hpName} は申請中につき保護`);
        } else {
          updateData.start_time = startTime;
          updateData.end_time = endTime;
          updateData.status = 'official';
          updateData.is_official = true;
        }

        await supabase.from('shifts').upsert(updateData, { onConflict: 'login_id,shift_date' });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}