// ...（前段のインポート等はそのまま）

export async function GET() {
  // ...（環境変数チェック等はそのまま）
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    const { data: casts } = await supabase.from('cast_members').select('login_id, display_name');
    const castMap: { [key: string]: string } = {};
    casts?.forEach(c => { castMap[c.display_name] = c.login_id; });

    // 💡 ここを ShiftData[] ではなく any[] にすると波線が消えます
    const results: any[] = []; 
    const today = new Date();

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
            status: 'official' 
          });
        }
      });
    }

    // 💡 results の後に 「as any」を付けるのも波線消去に有効です
    if (results.length > 0) {
      const { error: upsertError } = await supabase
        .from('shifts')
        .upsert(results, { onConflict: 'login_id,shift_date' });
      
      if (upsertError) return NextResponse.json({ success: false, error: upsertError.message });
    }

    // --- 【重要】HPから消えたシフトを canceled にするロジック ---
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
      const missingFromHp = currentDbShifts.filter(s => !activeIds.includes(`${s.login_id}_${s.shift_date}`));
      for (const s of missingFromHp) {
        await supabase
          .from('shifts')
          .update({ status: 'canceled' })
          .eq('login_id', s.login_id)
          .eq('shift_date', s.shift_date);
      }
    }

    return NextResponse.json({ success: true, count: results.length });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}