import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  let debugLog: any[] = [];

  try {
    // 1. キャスト名簿を取得
    const { data: allCasts } = await supabase
      .from('cast_members')
      .select('login_id, hp_display_name');

    // 型を明示して波線を消す（s: string）
    const normalize = (str: string) => {
      return str
        .replace(/\s+/g, '') // スペース除去
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) => {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); // 全角→半角
        });
    };

    const cleanCastList = allCasts?.map(c => ({
      ...c,
      matchName: normalize(c.hp_display_name)
    })) || [];

    // 2. 公式HPから今日の日付分を取得
    const targetDate = new Date(Date.now() + JST_OFFSET);
    const dateStr = targetDate.toISOString().split('T')[0];
    const hpDateStr = dateStr.replace(/-/g, '/');

    const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { 
      cache: 'no-store' 
    });
    const html = await hpRes.text();
    const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

    for (const item of listItems) {
      const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
      const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
      if (!nameMatch || !timeMatch) continue;

      // HPの名前をクリーンアップ
      const hpNameRaw = nameMatch[1].replace(/[（\(\[].*?[）\)\]]/g, '').trim();
      const cleanHPName = normalize(hpNameRaw);

      const targetCast = cleanCastList.find(c => c.matchName === cleanHPName);

      if (targetCast) {
        await supabase.from('shifts').upsert({ 
          login_id: targetCast.login_id, 
          shift_date: dateStr, 
          hp_display_name: targetCast.hp_display_name, 
          start_time: timeMatch[1], 
          end_time: timeMatch[2], 
          status: 'official', 
          is_official: true 
        }, { onConflict: 'login_id,shift_date' });
        
        debugLog.push({ 状態: "✅一致", HP名: cleanHPName, DB名: targetCast.hp_display_name });
      } else {
        // ここに名前が出ているのに反映されない場合、DBの hp_display_name が間違っています
        debugLog.push({ 状態: "❌不一致", HP名: cleanHPName, 理由: "DBに対応する名前がありません" });
      }
    }

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });
    
    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      debug: debugLog, 
      db_registered_count: cleanCastList.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}