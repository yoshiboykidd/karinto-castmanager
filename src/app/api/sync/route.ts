import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

// データの設計図を定義
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
    const { data: casts } = await supabase.from('cast_members').select('login_id, display_name');
    const castMap = Object.fromEntries(casts?.map(c => [c.display_name, c.login_id]) || []);

    const today = new Date();
    // ここを修正：ShiftDataの形をしたリストですよ、と教えてあげる
    const results: ShiftData[] = [];

    // 今日から7日分くらいを取得するように少し拡張しました
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      // 日本時間に合わせて日付文字列を作成
      const y = targetDate.getFullYear();
      const m = ('0' + (targetDate.getMonth() + 1)).slice(-2);
      const d = ('0' + targetDate.getDate()).slice(-2);
      const dateStrSlash = `${y}/${m}/${d}`;
      const dateStrHyphen = `${y}-${m}-${d}`;

      const res = await fetch(`https://ikekari.com/attend.php?date_get=${dateStrSlash}`, { cache: 'no-store' });
      const html = await res.text();
      const $ = cheerio.load(html);

      $('li').each((_, el) => {
        const name = $(el).find('h3').text().split('（')[0].trim();
        const time = $(el).find('p').filter((_, p) => $(p).text().includes(':')).text().trim();

        if (castMap[name] && time.includes('-')) {
          const [start, end] = time.split('-');
          results.push({
            login_id: castMap[name] as string,
            shift_date: dateStrHyphen,
            start_time: start.trim(),
            end_time: end.trim()
          });
        }
      });
    }

    if (results.length > 0) {
      const { error } = await supabase.from('shifts').upsert(results, { onConflict: 'login_id,shift_date' });
      if (error) throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `${results.length}件のシフトを同期しました`,
      date: new Date().toLocaleString('ja-JP')
    });
  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}