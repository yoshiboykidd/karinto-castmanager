import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { format, addDays } from 'date-fns';

interface ShiftData {
  login_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  hp_display_name: string;
  status: 'official'; // 常に official として登録
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

    if (castError) return NextResponse.json({ success: false, error: castError.message });

    const castMap: { [key: string]: string } = {};
    casts?.forEach(c => { castMap[c.display_name] = c.login_id; });

    const results: ShiftData[] = [];
    const today = new Date();
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addDays(today, 7), 'yyyy-MM-dd');

    // 2. HPから7日分取得
    for (let i = 0; i < 7; i++) {
      const targetDate = addDays(today, i);
      const dateStrSlash = format(targetDate, 'yyyy/MM/dd');
      const dateStrHyphen = format(targetDate, 'yyyy-MM-dd');

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
            hp_display_name: name,
            status: 'official' // HPにあるものは「確定」
          });
        }
      });
    }

    // 3. 【改善】破壊的なデリートを廃止し、UPSERTで「時間とステータスだけ」更新
    // これにより、f_count や reward_amount は維持されます
    if (results.length > 0) {
      const { error: upsertError } = await supabase
        .from('shifts')
        .upsert(results, { 
          onConflict: 'login_id,shift_date',
          // status, start_time, end_time のみを更新対象にする設定が理想ですが、
          // resultsに実績カラムを含めなければ現在の値が保持されます。
        });
      
      if (upsertError) return NextResponse.json({ success: false, error: upsertError.message });
    }

    // 4. 【高度な整合性】HPから消えたシフトを「欠勤/削除」として扱う
    // DBにはあるが今回のHP取得結果に含まれなかった「official」なシフトを特定
    const activeIds = results.map(r => `${r.login_id}_${r.shift_date}`);
    
    // 今日から7日間のofficialシフトを取得
    const { data: currentDbShifts } = await supabase
      .from('shifts')
      .select('login_id, shift_date')
      .eq('status', 'official')
      .gte('shift_date', startDate)
      .lte('shift_date', endDate);

    if (currentDbShifts) {
      const missingFromHp = currentDbShifts.filter(s => !activeIds.includes(`${s.login_id}_${s.shift_date}`));
      
      // HPから消えたものは削除せず status を 'canceled' に変える（実績データを守るため）
      for (const s of missingFromHp) {
        await supabase
          .from('shifts')
          .update({ status: 'canceled' })
          .eq('login_id', s.login_id)
          .eq('shift_date', s.shift_date);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      sync_at: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}