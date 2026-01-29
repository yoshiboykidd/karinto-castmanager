import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 1. キャスト一覧を取得
    const { data: casts } = await supabase.from('cast_members').select('login_id, display_name');
    const castMap = Object.fromEntries(casts?.map(c => [c.display_name, c.login_id]) || []);

    const today = new Date();
    const results = [];

    // 2. 今日から3日分くらいをとりあえず取得
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '/');

      const res = await fetch(`https://ikekari.com/attend.php?date_get=${dateStr}`, { cache: 'no-store' });
      const html = await res.text();
      const $ = cheerio.load(html);

      // キャスト情報の解析
      $('li').each((_, el) => {
        const name = $(el).find('h3').text().split('（')[0].trim();
        const time = $(el).find('p').filter((_, p) => $(p).text().includes(':')).text().trim();

        if (castMap[name] && time.includes('-')) {
          const [start, end] = time.split('-');
          results.push({
            login_id: castMap[name],
            shift_date: dateStr.replace(/\//g, '-'),
            start_time: start,
            end_time: end
          });
        }
      });
    }

    // 3. Supabase を更新
    if (results.length > 0) {
      await supabase.from('shifts').upsert(results, { onConflict: 'login_id,shift_date' });
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}