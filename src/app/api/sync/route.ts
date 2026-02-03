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
  const cacheBuster = Date.now();

  try {
    // 1. 【改善】ループの外で、全キャストの名簿を一度だけ取得する（.execute()は不要！）
    const { data: allCasts, error: castError } = await supabase
      .from('cast_members')
      .select('login_id, hp_display_name');

    if (castError || !allCasts) {
      throw new Error(`キャスト名簿の取得に失敗: ${castError?.message}`);
    }

    // スペースを除去した比較用の名簿リストを作成
    const cleanCastList = allCasts.map(c => ({
      ...c,
      matchName: c.hp_display_name.replace(/\s+/g, '')
    }));

    const dates = Array.from({ length: 9 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + (i - 1) * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    await Promise.all(dates.map(async (dateStr) => {
      const hpDateStr = dateStr.replace(/-/g, '/');
      
      try {
        const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${cacheBuster}`, { 
          cache: 'no-store'
        });
        const html = await hpRes.text();
        const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

        for (const item of listItems) {
          const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
          const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (!nameMatch || !timeMatch) continue;

          // HP側の名前をクリーンアップ（カッコ除去 ＆ スペース除去）
          const hpNameRaw = nameMatch[1].replace(/[（\(\[].*?[）\)\]]/g, '').trim();
          const cleanHPName = hpNameRaw.replace(/\s+/g, '');

          // JS側で高速に照合
          const targetCast = cleanCastList.find(c => c.matchName === cleanHPName);

          if (!targetCast) continue;

          // HP絶対優先で保存
          await supabase.from('shifts').upsert({ 
            login_id: targetCast.login_id, 
            shift_date: dateStr, 
            hp_display_name: targetCast.hp_display_name, 
            start_time: timeMatch[1],
            end_time: timeMatch[2],
            status: 'official',
            is_official: true,
            is_official_pre_exist: true 
          }, { onConflict: 'login_id,shift_date' });
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