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
    // 1. キャスト名簿の取得と正規化
    const { data: allCasts, error: castError } = await supabase
      .from('cast_members')
      .select('login_id, hp_display_name');

    if (castError) throw new Error(`DB取得失敗: ${castError.message}`);

    // ★ どんな型（null, undefined, 数字）が来ても絶対に文字列として処理する関数
    const normalize = (val: any): string => {
      if (val === null || val === undefined) return "";
      const str = String(val); // 強制的に文字列化
      return str
        .replace(/\s+/g, '') // ここでエラーが起きないよう String(val) している
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) => {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
    };

    const cleanCastList = (allCasts || []).map(c => ({
      ...c,
      matchName: normalize(c.hp_display_name)
    }));

    // 2. HP情報の取得
    const targetDate = new Date(Date.now() + JST_OFFSET);
    const dateStr = targetDate.toISOString().split('T')[0];
    const hpDateStr = dateStr.replace(/-/g, '/');

    const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { 
      cache: 'no-store' 
    });
    
    const html = await hpRes.text();
    if (!html) throw new Error("HPからデータを取得できませんでした");

    const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

    for (const item of listItems) {
      try {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        
        // 名前か時間が取れない項目はスキップ
        if (!nameMatch || !nameMatch[1] || !timeMatch) continue;

        const hpNameRaw = nameMatch[1];
        // カッコを除去
        const hpNameCleaned = hpNameRaw.replace(/[（\(\[].*?[）\)\]]/g, '').trim();
        const cleanHPName = normalize(hpNameCleaned);

        const targetCast = cleanCastList.find(c => c.matchName === cleanHPName);

        if (targetCast) {
          const { error: upsertError } = await supabase.from('shifts').upsert({ 
            login_id: targetCast.login_id, 
            shift_date: dateStr, 
            hp_display_name: targetCast.hp_display_name || hpNameCleaned, 
            start_time: timeMatch[1], 
            end_time: timeMatch[2], 
            status: 'official', 
            is_official: true 
          }, { onConflict: 'login_id,shift_date' });
          
          debugLog.push({ 状態: "✅一致", 名前: cleanHPName, 結果: upsertError ? "DBエラー" : "成功" });
        } else {
          debugLog.push({ 状態: "❌不一致", HP名: cleanHPName, 理由: "DB未登録" });
        }
      } catch (innerError) {
        // ループ内でエラーが起きても、次のキャストの処理を止めない
        continue;
      }
    }

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });
    
    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      count: debugLog.length,
      debug: debugLog 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      message: error.message,
      stack: error.stack?.split('\n')[0] // エラーが起きた行を特定しやすくする
    }, { status: 500 });
  }
}