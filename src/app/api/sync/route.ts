import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Vercelのタイムアウトを回避するため60秒に設定
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 日本時間（JST）への調整
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  let debugLog: any[] = [];

  try {
    // 1. キャスト名簿を取得し、名寄せ用に正規化
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');
    
    const normalize = (val: any): string => {
      let s = (val === null || val === undefined) ? "" : String(val);
      // HTMLタグ削除、カッコ内削除、スペース削除
      s = s.replace(/<[^>]*>?/gm, '').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/\s+/g, '');
      // 全角英数字を半角に
      return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (m: string) => String.fromCharCode(m.charCodeAt(0) - 0xFEE0));
    };

    const cleanCastList = (allCasts || []).map(c => ({
      ...c,
      matchName: normalize(c.hp_display_name)
    }));

    // 2. 同期対象（今日を中心に前後含め9日間）
    const dates = Array.from({ length: 9 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + (i - 1) * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    for (const dateStr of dates) {
      // --- Step A: 生存確認のリセット ---
      // その日の全キャストの「今HPに載っているフラグ」を一旦折る
      await supabase.from('shifts').update({ is_official: false }).eq('shift_date', dateStr);

      // --- Step B: HPから最新情報を取得 ---
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
          // HPに載っている人を「公式(official)」として確定・更新
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

      // --- Step C: 幽霊データの掃除（店長がHPから消した人を反映） ---
      // 「status=official」なのに「is_official=false（今回のHPスキャンで見当たらなかった）」人
      // つまり店長が承認してHPから消した（＝休みになった）ので、申請中(requested)に戻す
      await supabase.from('shifts')
        .update({ status: 'requested' })
        .eq('shift_date', dateStr)
        .eq('status', 'official')
        .eq('is_official', false);
        
      debugLog.push({ date: dateStr, status: "ok" });
    }

    // 3. 同期完了時刻をDBに記録（マイページ表示用）
    const nowJST = new Date(Date.now() + JST_OFFSET).toISOString();
    await supabase.from('sync_logs').upsert({ 
      id: 1, 
      last_sync_at: nowJST 
    });

    return NextResponse.json({ 
      version: "v3.3.1", 
      success: true, 
      last_sync: nowJST,
      debug: debugLog 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}