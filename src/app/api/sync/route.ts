import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 1. 【最重要】タイムアウトを 30秒 に延長 (Vercel Hobbyの限界値)
export const maxDuration = 30; 
// キャッシュを無効化
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // 2. cookies() を使わず、直接 Supabase クライアントを作成（高速化）
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const JST_OFFSET = 9 * 60 * 60 * 1000;
  console.log("🚀 同期ジョブ開始");

  try {
    // 3. 負荷軽減のため、取得範囲を「今日〜7日後」に絞る（11日間は重すぎたため）
    for (let i = 0; i <= 7; i++) {
      const targetDate = new Date(Date.now() + JST_OFFSET + i * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().split('T')[0];
      const hpDateStr = dateStr.replace(/-/g, '/');

      // fetch にタイムアウトを設定し、1日が詰まっても次に進めるようにする
      const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}`, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5秒で諦める
      });
      
      const html = await hpRes.text();
      const listItems = html.match(/<li>[\s\S]*?<\/li>/g) || [];

      for (const item of listItems) {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!nameMatch || !timeMatch) continue;

        const hpName = nameMatch[1].replace(/（\d+）/g, '').trim();
        
        // キャストID取得
        const { data: cast } = await supabase.from('cast_members').select('login_id').eq('hp_display_name', hpName).single();
        if (!cast) continue;

        // 今のステータス確認
        const { data: existing } = await supabase.from('shifts').select('status').eq('login_id', cast.login_id).eq('shift_date', dateStr).maybeSingle();
        
        const updateData: any = { login_id: cast.login_id, shift_date: dateStr, hp_display_name: hpName, is_official_pre_exist: true };

        // 申請中(requested)なら時間を守る（三すくみ）
        if (existing?.status === 'requested') {
          // 何もしない（is_official_pre_exist だけ更新される）
        } else {
          updateData.start_time = timeMatch[1];
          updateData.end_time = timeMatch[2];
          updateData.status = 'official';
          updateData.is_official = true;
        }
        await supabase.from('shifts').upsert(updateData, { onConflict: 'login_id,shift_date' });
      }
    }

    // 4. 同期ログを更新（Page.tsx の「最終同期」に反映させる）
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });

    return NextResponse.json({ success: true, time: new Date().toISOString() });
  } catch (error: any) {
    console.error("❌ Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}