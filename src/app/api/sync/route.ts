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
    // --- 1. DBから名簿取得（空データでも死なない） ---
    const { data: allCasts, error: castError } = await supabase
      .from('cast_members')
      .select('login_id, hp_display_name');

    if (castError) {
      return NextResponse.json({ success: false, message: "DB名簿が取れません", error: castError });
    }

    const normalize = (val: any): string => {
      // どんなゴミデータ(null, undefined)が来ても強制的に空文字か文字列にする
      const s = val === null || val === undefined ? "" : String(val);
      return s.replace(/\s+/g, '').replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char: string) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
      });
    };

    const cleanCastList = (allCasts || []).map(c => ({
      ...c,
      matchName: normalize(c.hp_display_name)
    }));

    // --- 2. HPからデータ取得 ---
    const targetDate = new Date(Date.now() + JST_OFFSET);
    const dateStr = targetDate.toISOString().split('T')[0];
    const hpDateStr = String(dateStr).replace(/-/g, '/'); // 安全に置換

    const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { 
      cache: 'no-store' 
    });
    const html = await hpRes.text();
    const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

    // --- 3. 解析ループ（一人ずつエラーから守る） ---
    for (const item of listItems) {
      try {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        
        if (!nameMatch || !timeMatch) continue;

        // nameMatch[1] が null の可能性を徹底的に排除
        const hpNameRaw = nameMatch[1] ? String(nameMatch[1]) : "";
        const hpNameCleaned = hpNameRaw.replace(/[（\(\[].*?[）\)\]]/g, '').trim();
        const cleanHPName = normalize(hpNameCleaned);

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
          debugLog.push({ 状態: "✅一致", 名前: cleanHPName });
        } else {
          debugLog.push({ 状態: "❌不一致", HP名: cleanHPName });
        }
      } catch (innerE) {
        // 一人でエラーが起きても全体を止めない
        debugLog.push({ 状態: "⚠️エラー", info: "個別解析失敗" });
        continue;
      }
    }

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });
    
    // ↓ ここが重要！この形式で表示されれば「新コード」が動いています
    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      debug: debugLog 
    });

  } catch (error: any) {
    // 最終的なエラー出力も形式を統一
    return NextResponse.json({ 
      success: false,
      message: "メイン処理でエラー",
      error_detail: error.message 
    }, { status: 500 });
  }
}