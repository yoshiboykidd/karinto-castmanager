import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

// データの形を定義（hp_display_name を追加）
interface ShiftData {
  login_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  hp_display_name: string; 
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: false, error: "環境変数が不足しています" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. キャスト一覧の取得
    const { data: casts, error: castError } = await supabase
      .from('cast_members')
      .select('login_id, display_name');

    if (castError) {
      return NextResponse.json({ success: false, step: 'キャスト取得失敗', error: castError.message });
    }

    const castMap: { [key: string]: string } = {};
    casts?.forEach(c => {
      castMap[c.display_name] = c.login_id;
    });

    const results: ShiftData[] = [];
    const today = new Date();

    // 2. HPから7日分取得するように設定
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      const dateStrSlash = `${y}/${m}/${d}`;
      const dateStrHyphen = `${y}-${m}-${d}`;

      const res = await fetch(`https://ikekari.com/attend.php?date_get=${dateStrSlash}`, { cache: 'no-store' });
      const html = await res.text();
      const $ = cheerio.load(html);

      $('li').each((_, el) => {
        const name = $(el).find('h3').text().split('（')[0].trim();
        const time = $(el).find('p').filter((_, p) => $(p).text().includes(':')).first().text().trim();

        if (castMap[name] && time.includes('-')) {
          const [start, end] = time.split('-');
          results.push({
            login_id: castMap[name],
            shift_date: dateStrHyphen,
            start_time: start.trim(),
            end_time: end.trim(),
            hp_display_name: name // ここを追加しました！
          });
        }
      });
    }

    // 3. Supabaseに保存（upsert）
    if (results.length > 0) {
      const { error: upsertError } = await supabase
        .from('shifts')
        .upsert(results, { onConflict: 'login_id,shift_date' });
      
      if (upsertError) {
        return NextResponse.json({ success: false, step: 'upsert', error: upsertError.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length, 
      message: `${results.length}件のシフトを同期しました` 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, step: 'unknown', error: err.message || String(err) });
  }
}