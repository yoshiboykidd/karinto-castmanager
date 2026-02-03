import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;

  try {
    const { data: allCasts } = await supabase.from('cast_members').select('login_id, hp_display_name');
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
      // Step A: 「HPに載っていた」というフラグだけを下ろす（申請データは守る）
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
          // HPに載っている＝「official（確定）」として上書き
          await supabase.from('shifts').upsert({ 
            login_id: targetCast.login_id, shift_date: dateStr, hp_display_name: targetCast.hp_display_name, 
            start_time: timeMatch[1], end_time: timeMatch[2], status: 'official', is_official: true 
          }, { onConflict: 'login_id,shift_date' });
        }
      }

      // ★Step C: 【修正】HPから名前が消えた場合、元々「official」だったものだけを「requested」に落とす
      // 最初から「requested」で出している新規申請は、ここで無視されるため保護されます
      await supabase.from('shifts')
        .update({ status: 'requested' })
        .eq('shift_date', dateStr)
        .eq('status', 'official') // ここがポイント
        .eq('is_official', false);
    }

    const nowUTC = new Date().toISOString(); 
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: nowUTC });
    return NextResponse.json({ version: "v3.3.4", success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}