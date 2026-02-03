import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const JST_OFFSET = 9 * 60 * 60 * 1000;
  // キャッシュを破壊するためのタイムスタンプ
  const cacheBuster = Date.now();

  try {
    const dates = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + i * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    await Promise.all(dates.map(async (dateStr) => {
      const hpDateStr = dateStr.replace(/-/g, '/');
      
      try {
        // URLの末尾に時刻を付けて、公式HPのサーバーからも最新を強制取得する
        const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${cacheBuster}`, { 
          cache: 'no-store'
        });
        const html = await hpRes.text();
        const listItems = html.match(/<li>[\s\S]*?<\/li>/g) || [];

        for (const item of listItems) {
          const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
          const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (!nameMatch || !timeMatch) continue;

          // 名前から全角・半角両方のカッコを除去してクリーンにする
          const hpName = nameMatch[1].replace(/[（\(]\d+[）\)]/g, '').trim();

          const { data: cast } = await supabase.from('cast_members').select('login_id').eq('hp_display_name', hpName).single();
          if (!cast) continue;

          // 【修正：HP絶対優先ロジック】
          // HPに情報がある場合は、申請中(requested)であっても
          // HP側の時間と「official」ステータスを絶対正解として上書きする。
          const updateData = { 
            login_id: cast.login_id, 
            shift_date: dateStr, 
            hp_display_name: hpName, 
            start_time: timeMatch[1],
            end_time: timeMatch[2],
            status: 'official', // 確定に昇格
            is_official: true,
            is_official_pre_exist: true 
          };

          await supabase.from('shifts').upsert(updateData, { onConflict: 'login_id,shift_date' });
        }
      } catch (err) {
        console.error(`Error ${dateStr}:`, err);
      }
    }));

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}