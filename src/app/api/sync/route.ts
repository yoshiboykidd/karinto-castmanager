import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { addDays, format } from 'date-fns';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// 📍 12店舗すべてのリストを復元
const ALL_SHOPS = [
  { id: '001', name: '神田', baseUrl: 'https://www.kakarinto.com/attend.php' }, 
  { id: '002', name: '赤坂', baseUrl: 'https://www.akakari10.com/attend.php' }, 
  { id: '003', name: '秋葉原', baseUrl: 'https://www.akikarinto.com/attend.php' }, 
  { id: '004', name: '上野', baseUrl: 'https://www.karin360plus-ueno.com/attend.php' }, 
  { id: '005', name: '渋谷', baseUrl: 'https://www.shibuyakarinto.com/attend.php' }, 
  { id: '006', name: '池西', baseUrl: 'https://ikekari.com/attend.php' }, 
  { id: '007', name: '五反田', baseUrl: 'https://www.karin-go.com/attend.php' }, 
  { id: '008', name: '大宮', baseUrl: 'https://www.karin10omiya.com/attend.php' },
  { id: '009', name: '吉祥寺', baseUrl: 'https://www.kari-kichi.com/attend.php' }, 
  { id: '010', name: '大久保', baseUrl: 'https://www.ookubo-karinto.com/attend.php' }, 
  { id: '011', name: '池東', baseUrl: 'https://www.karin10bukuro-3shine.com/attend.php' }, 
  { id: '012', name: '小岩', baseUrl: 'https://www.karin10koiwa.com/attend.php' }
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const logs: string[] = [];
  const targetDates = [format(new Date(), 'yyyy-MM-dd'), format(addDays(new Date(), 1), 'yyyy-MM-dd')];

  // 名前のゆらぎを吸収する関数
  const normalize = (s: string) => s.replace(/[\s　\n\t]/g, '').toLowerCase();

  for (const shop of ALL_SHOPS) {
    try {
      const res = await fetch(`${shop.baseUrl}?t=${Date.now()}`, { cache: 'no-store' });
      const html = await res.text();
      const $ = cheerio.load(html);

      // DBからキャスト一覧を取得
      const { data: castMembers } = await supabase
        .from('cast_members')
        .select('login_id, display_name, hp_display_name')
        .eq('home_shop_id', shop.id);

      if (!castMembers) continue;

      for (const dateStrDB of targetDates) {
        const dateObj = new Date(dateStrDB);
        const dayOfMonth = dateObj.getDate();
        const foundInHP = new Set<string>();
        const upsertBatch: any[] = [];

        // 既存のシフトを取得（当欠ガードのため）
        const { data: existingShifts } = await supabase
          .from('shifts')
          .select('login_id, status')
          .eq('shift_date', dateStrDB);
        
        const existingMap = new Map(existingShifts?.map(s => [String(s.login_id).trim().padStart(8, '0'), s]));

        // HPのテーブルを解析
        $('table tr').each((_, tr) => {
          const cells = $(tr).find('td');
          if (cells.length < 31) return;

          const rawName = $(cells[0]).text().trim();
          if (!rawName) return;

          const targetMember = castMembers.find(m => 
            normalize(m.hp_display_name || m.display_name) === normalize(rawName)
          );

          if (!targetMember) return;
          const lid = String(targetMember.login_id).trim().padStart(8, '0');
          
          // 当欠ステータスの場合は同期をスキップして保護
          if (existingMap.get(lid)?.status === 'absent') {
            foundInHP.add(lid);
            return;
          }

          const timeStr = $(cells[dayOfMonth]).text().trim();
          if (timeStr && timeStr.includes('~')) {
            const [hpStart, hpEnd] = timeStr.split('~').map(t => t.trim().padStart(5, '0') + ':00');
            foundInHP.add(lid);
            upsertBatch.push({
              login_id: lid,
              shift_date: dateStrDB,
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

        // HPから消えたキャストのクリーンアップ（officialのみ対象）
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
        logs.push(`${shop.name}${dateStrDB.slice(5)} (+${upsertBatch.length}/-${removeCount})`);
      }
    } catch (e: any) {
      logs.push(`${shop.name} Error`);
    }
  }

  // スクレイピング完了ログを保存
  await supabase.from('scraping_logs').insert({
    executed_at: new Date().toISOString(),
    status: 'success',
    details: logs.join(', ')
  });

  return NextResponse.json({ success: true, logs });
}