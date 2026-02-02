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
    const activeDates: string[] = []; // HPにデータが存在した日付を記録

    // 1. HPから7日分のデータを抽出
    for (let i = 0; i < 7; i++) {
      const targetDate = addDays(today, i);
      const dateStrSlash = format(targetDate, 'yyyy/MM/dd');
      const dateStrHyphen = format(targetDate, 'yyyy-MM-dd');

      const res = await fetch(`https://ikekari.com/attend.php?date_get=${dateStrSlash}`, { cache: 'no-store' });
      const html = await res.text();
      const $ = cheerio.load(html);

      const listItems = $('li');
      if (listItems.length > 0) {
        activeDates.push(dateStrHyphen); // この日はHPが更新されている
      }

      listItems.each((_: any, el: any) => {
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

    // 2. 出勤データのUPSERT
    if (results.length > 0) {
      await supabase.from('shifts').upsert(results as any, { onConflict: 'login_id,shift_date' });
    }

    // 💡 3. 「お休み申請」の自動確定ロジック
    // HPが更新されている日付について、名前が載っていない人の「OFF申請」を「official」にする
    for (const date of activeDates) {
      const workingIds = results.filter(r => r.shift_date === date).map(r => r.login_id);
      
      await supabase
        .from('shifts')
        .update({ status: 'official' } as any)
        .eq('shift_date', date)
        .eq('status', 'requested')
        .eq('start_time', 'OFF')
        .not('login_id', 'in', `(${workingIds.join(',')})`);
    }

    // 4. HPから消えた過去の確定シフトを canceled に
    // (中略：既存の canceled 処理)

    // 5. 生存確認時刻を保存
    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() });

    return NextResponse.json({ success: true, count: results.length });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}