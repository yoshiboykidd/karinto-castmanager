// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { format, addDays } from 'date-fns';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase: any = createClient(supabaseUrl!, supabaseKey!);

  try {
    const { data: casts } = await supabase.from('cast_members').select('login_id, display_name');
    const castMap: { [key: string]: string } = {};
    casts?.forEach((c: any) => { castMap[c.display_name] = c.login_id; });

    const results: any[] = []; 
    const today = new Date();

    // 1. HPから7日分のシフトを抽出
    for (let i = 0; i < 7; i++) {
      const targetDate = addDays(today, i);
      const dateStrSlash = format(targetDate, 'yyyy/MM/dd');
      const dateStrHyphen = format(targetDate, 'yyyy-MM-dd');

      const res = await fetch(`https://ikekari.com/attend.php?date_get=${dateStrSlash}`, { cache: 'no-store' });
      const html = await res.text();
      const $ = cheerio.load(html);

      $('li').each((_: any, el: any) => {
        const name = $(el).find('h3').text().split('（')[0].trim();
        const time = $(el).find('p').filter((_: any, p: any) => $(p).text().includes(':')).first().text().trim();

        if (castMap[name] && time.includes('-')) {
          const [start, end] = time.split('-');
          results.push({
            login_id: castMap[name],
            shift_date: dateStrHyphen,
            start_time: start.trim(),
            end_time: end.trim(),
            hp_display_name: name,
            status: 'official' 
          });
        }
      });
    }

    // 2. UPSERT実行（実績カラムは保護される）
    if (results.length > 0) {
      const { error: upsertError } = await supabase
        .from('shifts')
        .upsert(results as any, { onConflict: 'login_id,shift_date' });
      
      if (upsertError) return NextResponse.json({ success: false, error: upsertError.message });
    }

    // 3. HPから消えたシフトを canceled に変更
    const activeIds = results.map(r => `${r.login_id}_${r.shift_date}`);
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addDays(today, 7), 'yyyy-MM-dd');

    const { data: currentDbShifts } = await supabase
      .from('shifts')
      .select('login_id, shift_date')
      .eq('status', 'official')
      .gte('shift_date', startDate)
      .lte('shift_date', endDate);

    if (currentDbShifts) {
      const missingFromHp = currentDbShifts.filter((s: any) => !activeIds.includes(`${s.login_id}_${s.shift_date}`));
      for (const s of missingFromHp) {
        await supabase
          .from('shifts')
          .update({ status: 'canceled' } as any)
          .eq('login_id', s.login_id)
          .eq('shift_date', s.shift_date);
      }
    }

    // 💡 4. 生存確認時刻（データが変わらなくてもチェックした時間）を保存
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });

    return NextResponse.json({ success: true, count: results.length });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}