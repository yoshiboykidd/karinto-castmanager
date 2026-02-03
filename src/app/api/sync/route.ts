import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  let debugLog: any[] = [];

  try {
    // 1. 全キャスト取得（nullガード付き）
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');

    // どんなデータでも絶対に文字列として扱う「鉄壁」の関数
    const safeNormalize = (val: any): string => {
      if (!val) return "";
      const s = String(val);
      // ここで replace を呼ぶ前に再度型を確認
      return typeof s === 'string' 
        ? s.replace(/\s+/g, '').replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
        : "";
    };

    const cleanCastList = (allCasts || []).map(c => ({
      ...c, matchName: safeNormalize(c.hp_display_name)
    }));

    // 2. HPからデータ取得（URLにもキャッシュ殺しを追加）
    const targetDate = new Date(Date.now() + JST_OFFSET);
    const dateStr = targetDate.toISOString().split('T')[0];
    const hpDateStr = (dateStr || "").split('-').join('/');

    const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&v=${Date.now()}`, { 
      cache: 'no-store' 
    });
    const html = await hpRes.text();
    const listItems = html?.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

    // 3. 解析ループ（個別に try-catch をかけ、一人死んでも全体を止めない）
    for (const item of listItems) {
      try {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!nameMatch || !timeMatch) continue;

        const hpNameRaw = nameMatch[1] ? String(nameMatch[1]) : "";
        const hpNameCleaned = hpNameRaw.replace(/[（\(\[].*?[）\)\]]/g, '').trim();
        const cleanHPName = safeNormalize(hpNameCleaned);

        const targetCast = cleanCastList.find(c => c.matchName === cleanHPName);

        if (targetCast) {
          await supabase.from('shifts').upsert({ 
            login_id: targetCast.login_id, 
            shift_date: dateStr, 
            hp_display_name: targetCast.hp_display_name || hpNameCleaned, 
            start_time: timeMatch[1], 
            end_time: timeMatch[2], 
            status: 'official', 
            is_official: true 
          }, { onConflict: 'login_id,shift_date' });
          debugLog.push({ status: "✅", name: cleanHPName });
        } else {
          debugLog.push({ status: "❌", name: cleanHPName });
        }
      } catch (innerError) {
        continue; // 一人が null でも次へ
      }
    }

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });
    
    return NextResponse.json({ 
      status: "success", 
      version: "v3.1.0", // これが出るか確認してください
      date: dateStr,
      debug: debugLog 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      status: "error", 
      version: "v3.1.0",
      message: error.message 
    }, { status: 500 });
  }
}