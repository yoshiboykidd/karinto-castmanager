import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;

  try {
    // 1. キャスト名簿からID、HP表示名、そして店舗ID(home_shop_id)を取得
    const { data: allCasts } = await supabase
      .from('cast_members')
      .select('login_id, hp_display_name, home_shop_id');
      
    const normalize = (val: any): string => {
      let s = (val === null || val === undefined) ? "" : String(val);
      s = s.replace(/<[^>]*>?/gm, '').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/\s+/g, '');
      return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (m: string) => String.fromCharCode(m.charCodeAt(0) - 0xFEE0));
    };
    const cleanCastList = (allCasts || []).map(c => ({ ...c, matchName: normalize(c.hp_display_name) }));

    // 2. 今日から未来7日間（計8日間）を同期対象にする（過去の上書きを防止）
    const dates = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + (i * 24 * 60 * 60 * 1000));
      return d.toISOString().split('T')[0];
    });

    for (const dateStr of dates) {
      // Step A: 未来データの生存フラグ(is_official)を一旦リセット
      await supabase.from('shifts').update({ is_official: false }).eq('shift_date', dateStr);

      const hpDateStr = dateStr.replace(/-/g, '/');
      const html = await (await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { cache: 'no-store' })).text();
      const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

      // --- B. HPに掲載されているキャストの処理 ---
      for (const item of listItems) {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!nameMatch || !timeMatch) continue;

        const targetCast = cleanCastList.find(c => c.matchName === normalize(nameMatch[1]));
        if (targetCast) {
          const hpS = timeMatch[1];
          const hpE = timeMatch[2];

          // 現在のDBの状態（申請中か、現在の時間は何か）を確認
          const { data: current } = await supabase.from('shifts')
            .select('status, start_time, end_time')
            .eq('login_id', targetCast.login_id)
            .eq('shift_date', dateStr)
            .single();

          // 自動確定判定：アプリの申請内容とHPの時間が一致したか
          const isMatching = current?.status === 'requested' && 
                             current.start_time === hpS && 
                             current.end_time === hpE;

          const updateData: any = {
            login_id: targetCast.login_id,
            shift_date: dateStr,
            hp_display_name: targetCast.hp_display_name,
            hp_start_time: hpS,
            hp_end_time: hpE,
            is_official: true,
            // 【多店舗対応】shiftsテーブルの store_code カラムに店舗IDを記録（スタンプ）
            store_code: targetCast.home_shop_id 
          };

          // 申請中でない or 申請内容が一致したなら、同期して status を official にする
          if (current?.status !== 'requested' || isMatching) {
            updateData.start_time = hpS;
            updateData.end_time = hpE;
            updateData.status = 'official';
          }
          await supabase.from('shifts').upsert(updateData, { onConflict: 'login_id,shift_date' });
        }
      }

      // --- C. HPに掲載されていないキャスト（休み）の処理 ---
      const { data: absentShifts } = await supabase.from('shifts')
        .select('login_id, status, start_time, end_time')
        .eq('shift_date', dateStr)
        .eq('is_official', false);

      if (absentShifts) {
        for (const shift of absentShifts) {
          const hpS = 'OFF';
          const hpE = 'OFF';
          // キャストが「OFF」で申請しており、実際にHPに名前がない（＝休み承認）場合
          const isMatchingOff = shift.status === 'requested' && shift.start_time === 'OFF';

          const updateData: any = { 
            hp_start_time: hpS, 
            hp_end_time: hpE, 
            is_official: false 
          };

          // 元々確定だった or 休み申請が一致したなら、status を official に戻す（緑枠を消す）
          if (shift.status === 'official' || isMatchingOff) {
            updateData.start_time = hpS;
            updateData.end_time = hpE;
            updateData.status = 'official';
          }
          await supabase.from('shifts').update(updateData).eq('login_id', shift.login_id).eq('shift_date', dateStr);
        }
      }
    }

    const nowUTC = new Date().toISOString(); 
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: nowUTC });
    return NextResponse.json({ version: "v3.4.2", success: true, scope: "Today + 7 Days with Store Stamp" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}