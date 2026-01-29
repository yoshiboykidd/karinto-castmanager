import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

// データの形を定義
interface ShiftData {
  login_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
}

export async function GET() {
  // 環境変数のチェック
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: false, error: "環境変数が設定されていません" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. キャスト一覧の取得
    const { data: casts, error: castError } = await supabase
      .from('cast_members')
      .select('login_id, display_name');

    if (castError) {
      return NextResponse.json({ success: false, step: 'キャスト取得失敗', detail: castError.message });
    }

    const castMap: { [key: string]: string } = {};
    casts?.forEach(c => {
      castMap[c.display_name] = c.login_id;
    });

    const results: ShiftData[] = [];
    const today = new Date();

    // 2. HPからデータを取得（今日から3日分）
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      const dateStrSlash = `${y}/${m}/${d}`;

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
            shift_date: `${y}-${m}-${d}`,
            start_time: start.trim(),
            end_time: end.trim()
          });
        }
      });
    }

    // 3. Supabaseに保存
    if (results.length > 0) {
      const { error: upsertError } = await supabase
        .from('shifts')
        .upsert(results, { onConflict: 'login_id,shift_date' });
      
      if (upsertError) {
        return NextResponse.json({ success: false, step: '保存失敗', detail: upsertError.message });
      }
    }

    return NextResponse.json({ success: true, count: results.length, message: "同期完了" });

  } catch (err: unknown) {
    // エラーを確実に文字列にする
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, step: 'システムエラー', detail: errorMessage });
  }
}