import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // 5分おきなので処理時間は長めに確保
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  let debugLog: any[] = [];

  try {
    // 1. キャスト名簿の取得と正規化
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');
    const normalize = (val: any): string => {
      let s = (val === null || val === undefined) ? "" : String(val);
      s = s.replace(/<[^>]*>?/gm, '').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/\s+/g, '');
      return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (m: string) => String.fromCharCode(m.charCodeAt(0) - 0xFEE0));
    };
    const cleanCastList = (allCasts || []).map(c => ({ ...c, matchName: normalize(c.hp_display_name) }));

    // 2. 同期対象の日付（今日から前後1週間程度）
    const dates = Array.from({ length: 9 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + (i - 1) * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    for (const dateStr of dates) {
      // --- Step A: 生存確認のリセット ---
      // その日の全データの「今HPに載っているフラグ(is_official)」を一旦 false にする
      await supabase.from('shifts').update({ is_official: false }).eq('shift_date', dateStr);

      // --- Step B: HPスキャンと更新 ---
      const hpDateStr = dateStr.replace(/-/g, '/');
      const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { cache: 'no-store' });
      const html = await hpRes.text();
      const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

      for (const item of listItems) {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!nameMatch || !timeMatch) continue;

        const cleanHPName = normalize(nameMatch[1]);
        const targetCast = cleanCastList.find(c => c.matchName === cleanHPName);

        if (targetCast) {
          // HPに載っていたので「公式」として確定・更新
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
      }

      // --- Step C: 幽霊データの掃除（格下げ処理） ---
      // 「statusがofficial」なのに「is_officialがfalse（今回のスキャンで見つからなかった）」人を、
      // 店長がHPから消したと判断して requested（未確定）に格下げする。
      await supabase.from('shifts')
        .update({ status: 'requested' })
        .eq('shift_date', dateStr)
        .eq('status', 'official')
        .eq('is_official', false);
        
      debugLog.push({ date: dateStr, status: "Sync Completed" });
    }

    return NextResponse.json({ version: "v3.3.0", success: true, debug: debugLog });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}