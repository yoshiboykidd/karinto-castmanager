import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;

  try {
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');
    
    // 名前の名寄せ用正規化関数
    const normalize = (val: any): string => {
      let s = (val === null || val === undefined) ? "" : String(val);
      s = s.replace(/<[^>]*>?/gm, '').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/\s+/g, '');
      return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (m: string) => String.fromCharCode(m.charCodeAt(0) - 0xFEE0));
    };
    const cleanCastList = (allCasts || []).map(c => ({ ...c, matchName: normalize(c.hp_display_name) }));

    const dates = Array.from({ length: 9 }, (_, i) => {
      const d = new Date(Date.now() + JST_OFFSET + (i - 1) * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    for (const dateStr of dates) {
      // 1. HP生存フラグ(is_official)を一旦リセット
      await supabase.from('shifts').update({ is_official: false }).eq('shift_date', dateStr);

      const hpDateStr = dateStr.replace(/-/g, '/');
      const html = await (await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}&t=${Date.now()}`, { cache: 'no-store' })).text();
      const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];

      for (const item of listItems) {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!nameMatch || !timeMatch) continue;

        const targetCast = cleanCastList.find(c => c.matchName === normalize(nameMatch[1]));
        if (targetCast) {
          const hpS = timeMatch[1];
          const hpE = timeMatch[2];

          // 2. 現在のDBの状態をチェック
          const { data: current } = await supabase
            .from('shifts')
            .select('status, start_time, end_time')
            .eq('login_id', targetCast.login_id)
            .eq('shift_date', dateStr)
            .single();

          // ★自動確定ロジック：申請時間とHPの時間が一致したか？
          const isMatching = current?.status === 'requested' && current.start_time === hpS && current.end_time === hpE;

          const updateData: any = {
            login_id: targetCast.login_id,
            shift_date: dateStr,
            hp_display_name: targetCast.hp_display_name,
            hp_start_time: hpS, // HPの真実を常に記録
            hp_end_time: hpE,   // HPの真実を常に記録
            is_official: true
          };

          // 「申請中（requested）でない」 または 「時間が一致した（自動確定）」 場合のみ表示時間を同期
          if (current?.status !== 'requested' || isMatching) {
            updateData.start_time = hpS;
            updateData.end_time = hpE;
            updateData.status = 'official';
          }
          // 申請中で時間が不一致の場合は、start_time/end_time/status には触れない（キャストの希望を保護）

          await supabase.from('shifts').upsert(updateData, { onConflict: 'login_id,shift_date' });
        }
      }

      // 3. HPから名前が消えた場合の処理（お休み承認）
      // 元々 official だったものが HP になければ requested / OFF に落とす
      await supabase.from('shifts')
        .update({ status: 'requested', start_time: 'OFF', end_time: 'OFF' })
        .eq('shift_date', dateStr)
        .eq('status', 'official')
        .eq('is_official', false);
    }

    const nowUTC = new Date().toISOString(); 
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: nowUTC });
    return NextResponse.json({ success: true, message: "Sync Completed with Auto-Confirm Logic" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}