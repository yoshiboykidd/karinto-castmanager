import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JST_OFFSET = 9 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // Next.js 15+ 準拠の非同期クッキー取得
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {}, // 波線対策
        remove() {},
      },
    }
  );

  try {
    // 今日から10日後までを監視（過去は消えるため無視）
    for (let i = 0; i <= 10; i++) {
      const targetDate = new Date(Date.now() + JST_OFFSET + i * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().split('T')[0];
      const hpDateStr = dateStr.replace(/-/g, '/');

      const hpRes = await fetch(`https://ikekari.com/attend.php?date_get=${hpDateStr}`, { cache: 'no-store' });
      const html = await hpRes.text();
      const listItems = html.match(/<li>[\s\S]*?<\/li>/g) || [];

      for (const item of listItems) {
        const nameMatch = item.match(/<h3>(.*?)<\/h3>/);
        const timeMatch = item.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!nameMatch || !timeMatch) continue;

        const hpName = nameMatch[1].replace(/（\d+）/g, '').trim();
        const { data: cast } = await supabase.from('cast_members').select('login_id').eq('hp_display_name', hpName).single();
        if (!cast) continue;

        const { data: existing } = await supabase.from('shifts').select('status').eq('login_id', cast.login_id).eq('shift_date', dateStr).single();
        
        const updateData: any = { login_id: cast.login_id, shift_date: dateStr, hp_display_name: hpName, is_official_pre_exist: true };

        if (existing?.status === 'requested') {
          console.log(`[Protected] ${hpName} ${dateStr}`);
        } else {
          updateData.start_time = timeMatch[1];
          updateData.end_time = timeMatch[2];
          updateData.status = 'official';
          updateData.is_official = true;
        }
        await supabase.from('shifts').upsert(updateData, { onConflict: 'login_id,shift_date' });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}