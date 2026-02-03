import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Vercelに30秒まで待機を許可（Hobbyプラン最大値）
export const maxDuration = 30;
// キャッシュを一切使わない設定
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // 1. 高速化のため、ブラウザ用のライブラリではなく標準のSupabaseクライアントを使用
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const JST_OFFSET = 9 * 60 * 60 * 1000;
  console.log("🚀 同期ジョブ開始 (Parallel Mode)");

  try {
    // 2. 7日間分の日付リストを作成
    const dates = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + i * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    // 3. 【高速化の肝】1日ずつ待たず、全日程を一気に並列で取得・処理する
    await Promise.all(dates.map(async (dateStr) => {
      const hpDateStr = dateStr.replace(/-/g, '/');
      
      try {
        const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}`, { 
          cache: 'no-store' // 常に最新を強制
        });
        const html = await hpRes.text();
        const listItems = html.match(/<li>[\s\S]*?<\/li>/g) || [];

        for (const item of listItems) {
          const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
          const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (!nameMatch || !timeMatch) continue;

          const hpName = nameMatch[1].replace(/（\d+）/g, '').trim();

          // キャスト特定
          const { data: cast } = await supabase.from('cast_members').select('login_id').eq('hp_display_name', hpName).single();
          if (!cast) continue;

          // 現状のステータス確認
          const { data: current } = await supabase.from('shifts').select('status').eq('login_id', cast.login_id).eq('shift_date', dateStr).maybeSingle();

          const updateData: any = { 
            login_id: cast.login_id, 
            shift_date: dateStr, 
            hp_display_name: hpName, 
            is_official_pre_exist: true 
          };

          // 三すくみ（申請保護）
          if (current?.status !== 'requested') {
            updateData.start_time = timeMatch[1];
            updateData.end_time = timeMatch[2];
            updateData.status = 'official';
            updateData.is_official = true;
          }

          await supabase.from('shifts').upsert(updateData, { onConflict: 'login_id,shift_date' });
        }
      } catch (err) {
        console.error(`Error on ${dateStr}:`, err);
      }
    }));

    // 4. 最後に「同期完了時刻」をDBに刻む（これでPage.tsxの表示が更新される）
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("❌ Overall Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}