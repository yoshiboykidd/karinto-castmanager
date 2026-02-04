import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;

  try {
    // 1. 全キャストのマスターデータを取得
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');
    const normalize = (val: any): string => {
      let s = (val === null || val === undefined) ? "" : String(val);
      s = s.replace(/<[^>]*>?/gm, '').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/\s+/g, '');
      return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (m: string) => String.fromCharCode(m.charCodeAt(0) - 0xFEE0));
    };
    const cleanCastList = (allCasts || []).map(c => ({ ...c, matchName: normalize(c.hp_display_name) }));

    // 2. 同期対象の日付：今日から未来7日間（合計8日間）に固定
    // 過去（i - 1）を排除することで、昨日の実績データへの干渉を防止
    const dates = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + (i * 24 * 60 * 60 * 1000));
      return d.toISOString().split('T')[0];
    });

    for (const dateStr of dates) {
      // Step A: 今回の生存確認用フラグをリセット（今日以降のデータのみ）
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

          // 現在のDB状態を確認
          const { data: current } = await supabase
            .from('shifts')
            .select('status, start_time, end_time')
            .eq('login_id', targetCast.login_id)
            .eq('shift_date', dateStr)
            .single();

          // 自動確定：申請時間とHPの時間が完全に一致したか判定
          const isMatching = current?.status === 'requested' && 
                             current.start_time === hpS && 
                             current.end_time === hpE;

          const updateData: any = {
            login_id: targetCast.login_id,
            shift_date: dateStr,
            hp_display_name: targetCast.hp_display_name,
            hp_start_time: hpS,
            hp_end_time: hpE,
            is_official: true
          };

          // 確定済み(official) or 申請内容が一致した(自動承認)なら同期してofficial化
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

          // 自動確定：OFF申請をしていてHPにも名前がない場合
          const isMatchingOff = shift.status === 'requested' && shift.start_time === 'OFF';

          const updateData: any = {
            hp_start_time: hpS,
            hp_end_time: hpE,
            is_official: false
          };

          // すでに確定していた or OFF申請が承認されたなら、officialのままOFFを維持
          if (shift.status === 'official' || isMatchingOff) {
            updateData.start_time = hpS;
            updateData.end_time = hpE;
            updateData.status = 'official';
          }

          await supabase.from('shifts')
            .update(updateData)
            .eq('login_id', shift.login_id)
            .eq('shift_date', dateStr);
        }
      }
    }

    const nowUTC = new Date().toISOString(); 
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: nowUTC });
    return NextResponse.json({ version: "v3.4.1", success: true, scope: "Today + 7 Days" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}