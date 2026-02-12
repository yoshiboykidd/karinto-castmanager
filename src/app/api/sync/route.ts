import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { addDays, format } from 'date-fns';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

const ALL_SHOPS = [
  { id: '001', name: '神田', baseUrl: 'https://www.kakarinto.com/attend.php' }, 
  { id: '002', name: '赤坂', baseUrl: 'https://www.akakari10.com/attend.php' }, 
  { id: '003', name: '秋葉原', baseUrl: 'https://www.akikarinto.com/attend.php' }, 
  { id: '004', name: '上野', baseUrl: 'https://www.karin360plus-ueno.com/attend.php' }, 
  { id: '005', name: '渋谷', baseUrl: 'https://www.shibuyakarinto.com/attend.php' }, 
  { id: '006', name: '池西', baseUrl: 'https://ikekari.com/attend.php' }, 
  { id: '007', name: '五反田', baseUrl: 'https://www.karin-go.com/attend.php' }, 
  { id: '008', name: '大宮', baseUrl: 'https://www.karin10omiya.com/attend.php' }
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const normalize = (s: string) => s.replace(/[\s\u3000]/g, '').trim();

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return new NextResponse('Unauthorized', { status: 401 });
  }

  const logs: string[] = [];
  const targetDates = [format(new Date(), 'yyyy-MM-dd'), format(addDays(new Date(), 1), 'yyyy-MM-dd')];

  try {
    const { data: castData } = await supabase.from('cast_members').select('login_id, display_name');
    const nameMap = new Map();
    castData?.forEach(c => {
      if (c.display_name) nameMap.set(normalize(c.display_name), String(c.login_id).padStart(8, '0'));
    });

    for (const shop of ALL_SHOPS) {
      try {
        const res = await fetch(`${shop.baseUrl}?t=${Date.now()}`, { cache: 'no-store' });
        const html = await res.text();
        const $ = cheerio.load(html);
        const dateStrHP = $('.date').first().text().match(/(\d+)月(\d+)日/);
        if (!dateStrHP) continue;

        const dateStrDB = format(new Date(), 'yyyy') + '-' + dateStrHP[1].padStart(2, '0') + '-' + dateStrHP[2].padStart(2, '0');
        const { data: existingShifts } = await supabase.from('shifts').select('*').eq('shift_date', dateStrDB);
        const existingMap = new Map();
        existingShifts?.forEach(s => existingMap.set(String(s.login_id).padStart(8, '0'), s));

        const upsertBatch: any[] = [];
        const foundInHP = new Set<string>();
        const timeRegex = /(\d{2}:\d{2})\s*[-〜~]\s*(\d{2}:\d{2})/;

        $('h3, .name, .cast_name, span.name, div.name, strong').each((_, nameEl) => {
          const rawName = $(nameEl).text();
          const cleanName = normalize(rawName);
          const loginId = nameMap.get(cleanName);
          if (!loginId) return;

          const context = $(nameEl).text() + " " + $(nameEl).parent().text() + " " + $(nameEl).parent().parent().text();
          const timeMatch = context.match(timeRegex);

          if (timeMatch) {
            const hpStart = timeMatch[1].padStart(5, '0');
            const hpEnd = timeMatch[2].padStart(5, '0');
            const dbShift = existingMap.get(loginId);

            foundInHP.add(loginId);

            // 📍 修正：当欠保護ロジック
            // DBのステータスが 'absent'（当欠）の場合は、HPの情報で上書きせずスキップする
            if (dbShift?.status === 'absent') {
              return; 
            }

            if (dbShift?.status === 'requested') {
              if (dbShift.start_time !== hpStart || dbShift.end_time !== hpEnd) {
                return; 
              }
            }

            upsertBatch.push({
              login_id: loginId,
              shift_date: dateStrDB,
              store_code: shop.id,
              hp_display_name: cleanName,
              hp_start_time: hpStart,
              hp_end_time: hpEnd,
              start_time: hpStart,
              end_time: hpEnd,
              status: 'official',
              is_official: true,
              updated_at: new Date().toISOString()
            });
          }
        });

        let removeCount = 0;
        if (foundInHP.size > 0) {
          const idsToRemove = (existingShifts || [])
            .map(s => String(s.login_id).trim().padStart(8, '0'))
            .filter(id => !foundInHP.has(id) && existingMap.get(id)?.status === 'official');

          if (idsToRemove.length > 0) {
            await supabase
              .from('shifts')
              .delete()
              .eq('shift_date', dateStrDB)
              .in('login_id', idsToRemove);
            removeCount = idsToRemove.length;
          }
        }

        if (upsertBatch.length > 0) {
          await supabase.from('shifts').upsert(upsertBatch, { onConflict: 'login_id, shift_date' });
        }
        logs.push(`${dateStrDB.slice(5)} (+${upsertBatch.length}/-${removeCount})`);
      } catch (e: any) { logs.push(`${shop.name} Err`); }
    }

    await supabase.from('scraping_logs').insert({
      exec_type: 'cron_auto',
      status: 'success',
      message: logs.join(', ')
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}