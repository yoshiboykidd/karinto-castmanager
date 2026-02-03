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
    // 1. キャスト名簿の取得
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');

    // ★ どんなゴミデータが来ても絶対にエラーにしない normalize 関数
    const normalize = (str: any): string => {
      if (!str || typeof str !== 'string') return ""; // 文字列以外はすべて空文字にする
      return str
        .replace(/\s+/g, '') 
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) => {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
    };

    const cleanCastList = allCasts?.map(c => ({
      ...c,
      matchName: normalize(c.hp_display_name)
    })) || [];

    // 2. HP情報の取得
    const targetDate = new Date(Date.now() + JST_OFFSET);
    const dateStr = targetDate.toISOString().split('T')[0];
    const hpDateStr = dateStr.replace(/-/g, '/');

    const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { 
      cache: 'no-store' 
    });
    const html = await hpRes.text();
    const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

    for (const item of listItems) {
      // 正規表現の実行結果を安全に変数に入れる
      const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
      const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
      
      // マッチしない項目（広告など）はスルー
      if (!nameMatch || !nameMatch[1] || !timeMatch) continue;

      // ★ .replace を呼ぶ前に、確実に文字列であることを保証する
      const hpNameRaw: string = nameMatch[1];
      const hpNameCleaned = hpNameRaw.replace(/[（\(\[].*?[）\)\]]/g, '').trim();
      const cleanHPName = normalize(hpNameCleaned);

      const targetCast = cleanCastList.find(c => c.matchName === cleanHPName);

      if (targetCast) {
        const { error: upsertError } = await supabase.from('shifts').upsert({ 
          login_id: targetCast.login_id, 
          shift_date: dateStr, 
          hp_display_name: targetCast.hp_display_name, 
          start_time: timeMatch[1], 
          end_time: timeMatch[2], 
          status: 'official', 
          is_official: true 
        }, { onConflict: 'login_id,shift_date' });
        
        debugLog.push({ 
          状態: "✅一致", 
          名前: cleanHPName, 
          DB反映: upsertError ? "失敗" : "成功" 
        });
      } else {
        debugLog.push({ 状態: "❌不一致", HP名: cleanHPName, 理由: "DBにこの名前がいません" });
      }
    }

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });
    
    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      debug: debugLog,
      db_registered_cast_count: cleanCastList.length
    });

  } catch (error: any) {
    // どこで死んだか特定するための詳細出力
    return NextResponse.json({ 
      success: false,
      error_message: error.message,
      error_stack: error.stack?.split('\n').slice(0, 3) // 最初の3行だけ
    }, { status: 500 });
  }
}