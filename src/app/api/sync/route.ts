import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 1. キャスト一覧の取得
    const { data: casts, error: castError } = await supabase.from('cast_members').select('login_id, display_name');
    
    if (castError) {
      return NextResponse.json({ 
        success: false, 
        step: '1: キャスト一覧取得失敗', 
        error_msg: castError.message, 
        hint: castError.hint 
      });
    }

    const castMap = Object.fromEntries(casts?.map(c => [c.display_name, c.login_id]) || []);
    const today = new Date();
    const results = [];

    // 2. スクレイピング（とりあえず今日1日分でテスト）
    const y = today.getFullYear();
    const m = ('0' + (today.getMonth() + 1)).slice(-2);
    const d = ('0' + today.getDate()).slice(-2);
    const dateStrSlash = `${y}/${m}/${d}`;

    const res = await fetch(`https://ikekari.com/attend.php?date_get=${dateStrSlash}`, { cache: 'no-store' });
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

    if (results.length === 0) {
      return NextResponse.json({ success: false, step: '2: データ抽出ゼロ', msg: 'HPにキャストが見つかりませんでした' });
    }

    // 3. 保存
    const { error: upsertError } = await supabase.from('shifts').upsert(results, { onConflict: 'login_id,shift_date' });
    
    if (upsertError) {
      return NextResponse.json({ 
        success: false, 
        step: '3: 保存失敗', 
        error_msg: upsertError.message, 
        details: upsertError.details 
      });
    }

    return NextResponse.json({ success: true, count: results.length });

  } catch (err: any) {
    // あらゆるエラーを文字にして書き出す
    return NextResponse.json({ 
      success: false, 
      step: 'unknown_crash', 
      error_msg: err.message || '不明なエラー',
      stack: err.stack?.substring(0, 100) // エラーの場所を特定
    });
  }
}