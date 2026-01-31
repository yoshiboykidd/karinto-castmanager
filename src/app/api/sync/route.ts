import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { format, addDays } from 'date-fns'; // 日付操作ライブラリを使用

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
    // 1. キャスト一覧の取得（名前からIDを引くため）
    const { data: casts, error: castError } = await supabase
      .from('cast_members')
      .select('login_id, display_name');

    if (castError) return NextResponse.json({ success: false, step: 'キャスト取得失敗', error: castError.message });

    const castMap: { [key: string]: string } = {};
    casts?.forEach(c => { castMap[c.display_name] = c.login_id; });

    const results: ShiftData[] = [];
    const today = new Date();

    // --- 【追加】削除ロジック：同期対象期間（今日〜7日後）を特定 ---
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addDays(today, 7), 'yyyy-MM-dd');

    // これから取得する範囲のデータを一旦削除（これでHPから消えた予定がアプリでも消える）
    const { error: deleteError } = await supabase
      .from('shifts')
      .delete()
      .gte('shift_date', startDate)
      .lte('shift_date', endDate);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      // 削除失敗しても続行は可能ですが、一応ログに残します
    }
    // -------------------------------------------------------

    // 2. HPから7日分取得
    for (let i = 0; i < 7; i++) {
      const targetDate = addDays(today, i);
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
            hp_display_name: name
          });
        }
      });
    }

    // 3. 最新のデータを保存
    if (results.length > 0) {
      const { error: upsertError } = await supabase
        .from('shifts')
        .upsert(results, { onConflict: 'login_id,shift_date' });
      
      if (upsertError) return NextResponse.json({ success: false, step: 'upsert', error: upsertError.message });
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length, 
      message: `${startDate}から7日間の同期を完了しました（消滅したシフトも反映済み）` 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, step: 'unknown', error: err.message || String(err) });
  }
}