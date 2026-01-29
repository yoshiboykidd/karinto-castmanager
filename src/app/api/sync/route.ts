import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

interface ShiftData {
  login_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 1. キャスト一覧の取得
    const { data: casts, error: castError } = await supabase.from('cast_members').select('login_id, display_name');
    if (castError) return NextResponse.json({ success: false, step: 'fetch casts', error: castError.message });

    const castMap = Object.fromEntries(casts?.map(c => [c.display_name, c.login_id]) || []);
    const today = new Date();
    const results: ShiftData[] = [];

    // 2. 7日分取得
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const y = targetDate.getFullYear();
      const m = ('0' + (targetDate.getMonth() + 1)).slice(-2);
      const d = ('0' + targetDate.getDate()).slice(-2);
      const dateStrSlash = `${y}/${m}/${d}`;

      const res = await fetch(`https://ikekari.com/attend.php?date_get=${dateStrSlash}`, { cache: 'no-store' });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      $('li').each((_, el) => {
        const name = $(el).find('h3').text().split('（')[0].trim();
        const time = $(el).find('p').filter((_, p) => $(p).text().includes(':')).text().trim();

        if (castMap[name] && time.includes('-')) {
          const [start, end] = time.split('-');
          results.push({
            login_id: castMap[name],
            shift_date: `${y}-${m}-${d}`,
            start_time: start.trim(),
            end_time: end.trim()
          });
        }
      });
    }

    // 3. Supabaseへの保存
    if (results.length > 0) {
      const { error: upsertError } = await supabase.from('shifts').upsert(results, { 
        onConflict: 'login_id,shift_date' 
      });
      if (upsertError) return NextResponse.json({ success: false, step: 'upsert', error: upsertError.message });
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, step: 'unknown', error: err.message || String(err) });
  }
}