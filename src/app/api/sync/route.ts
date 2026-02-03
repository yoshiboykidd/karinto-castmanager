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
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');

    // ★ どんなゴミ（HTMLタグ、スペース、全角）も消し去る最強のクリーナー
    const normalize = (val: any): string => {
      if (!val) return "";
      return String(val)
        .replace(/<[^>]*>?/gm, '') // 【重要】HTMLタグ(span等)を完全に除去
        .replace(/\s+/g, '')       // 空白・改行を除去
        .replace(/[（\(\[].*?[）\)\]]/g, '') // カッコ内を除去
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); // 全角→半角
    };

    const cleanCastList = (allCasts || []).map(c => ({
      ...c,
      matchName: normalize(c.hp_display_name)
    }));

    const targetDate = new Date(Date.now() + JST_OFFSET);
    const dateStr = targetDate.toISOString().split('T')[0];
    const hpDateStr = dateStr.replace(/-/g, '/');

    const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { 
      cache: 'no-store' 
    });
    const html = await hpRes.text();
    const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

    for (const item of listItems) {
      try {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        
        if (!nameMatch || !timeMatch) continue;

        // HP側の名前を徹底的に掃除（ここで<span>等が消えます）
        const cleanHPName = normalize(nameMatch[1]);
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
          
          debugLog.push({ 状態: "✅一致", 名前: cleanHPName });
        } else {
          debugLog.push({ 状態: "❌不一致", HP名: cleanHPName });
        }
      } catch (e) { continue; }
    }

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });
    
    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      debug: debugLog 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}