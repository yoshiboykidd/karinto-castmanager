import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { addDays, format } from 'date-fns';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

const TARGET_SHOPS = [
  { id: '001', name: '神田', baseUrl: 'https://www.kakarinto.com/attend.php' }, 
  { id: '002', name: '赤坂', baseUrl: 'https://www.akakari10.com/attend.php' }, 
  { id: '003', name: '秋葉原', baseUrl: 'https://www.akikarinto.com/attend.php' }, 
  { id: '004', name: '上野', baseUrl: 'https://www.karin360plus-ueno.com/attend.php' }, 
  { id: '005', name: '渋谷', baseUrl: 'https://www.shibuyakarinto.com/attend.php' }, 
  { id: '006', name: '池西', baseUrl: 'https://ikekari.com/attend.php' }, 
  { id: '007', name: '五反田', baseUrl: 'https://www.karin-go.com/attend.php' }, 
  { id: '008', name: '大宮', baseUrl: 'https://www.karin10omiya.com/attend.php' }, 
  { id: '009', name: '吉祥寺', baseUrl: 'https://www.kari-kichi.com/attend.php' },
  { id: '011', name: '池東', baseUrl: 'https://www.karin10bukuro-3shine.com/attend.php' }, 
  { id: '012', name: '小岩', baseUrl: 'https://www.karin10koiwa.com/attend.php' }, 
];

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const JST_OFFSET = 9 * 60 * 60 * 1000;

  // 各店舗の処理を関数として独立
  const processShop = async (shop: typeof TARGET_SHOPS[0]) => {
    let localLogs: string[] = [`🏁 Start: ${shop.name}`];

    try {
      // 1. 名簿取得
      const { data: castList, error: castError } = await supabase
        .from('cast_members')
        .select('login_id, hp_display_name')
        .eq('home_shop_id', shop.id);

      if (castError || !castList || castList.length === 0) {
        return [`⚠️ Skip ${shop.name}: 名簿なし`];
      }

      const normalize = (val: string) => {
        if (!val) return "";
        let s = val.replace(/\s+/g, '').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/（\d+）/g, ''); 
        return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
      };

      const nameMap = new Map(castList.map(c => [normalize(c.hp_display_name), c.login_id]));

      // 7日分のPromiseを作成
      const dayPromises = Array.from({ length: 7 }).map(async (_, i) => {
        const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
        const dateStrDB = format(targetDate, 'yyyy-MM-dd');
        const dateStrURL = format(targetDate, 'yyyy/MM/dd');
        const url = `${shop.baseUrl}?date_get=${dateStrURL}&t=${Date.now()}`;

        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return null;
          const html = await res.text();
          const $ = cheerio.load(html);

          const { data: existingShifts } = await supabase
            .from('shifts')
            .select('login_id, status')
            .eq('shift_date', dateStrDB);

          const existingStatusMap = new Map(existingShifts?.map(s => [s.login_id, s.status]));
          const batchData: any[] = [];

          $('li').each((_, element) => {
            const li = $(element);
            const cleanName = normalize(li.find('h3').text());
            const timeMatch = li.text().match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

            if (cleanName && timeMatch) {
              const loginId = nameMap.get(cleanName);
              if (loginId) {
                const currentStatus = existingStatusMap.get(loginId);
                const baseData = { login_id: loginId, shift_date: dateStrDB, hp_display_name: cleanName, is_official_pre_exist: true };
                
                if (currentStatus === 'requested') {
                  batchData.push(baseData);
                } else {
                  batchData.push({
                    ...baseData,
                    start_time: timeMatch[1].padStart(5, '0'),
                    end_time: timeMatch[2].padStart(5, '0'),
                    status: 'official',
                    is_official: true
                  });
                }
              }
            }
          });

          if (batchData.length > 0) {
            const { error } = await supabase.from('shifts').upsert(batchData, { onConflict: 'login_id, shift_date' });
            return error ? `❌ ${dateStrDB} DB Error` : `✅ ${dateStrDB} (${batchData.length}件)`;
          }
          return null;
        } catch {
          return `❌ ${dateStrDB} Parse Error`;
        }
      });

      const dayResults = await Promise.all(dayPromises);
      localLogs.push(...dayResults.filter((r): r is string => r !== null));
      return localLogs;

    } catch (e: any) {
      return [`❌ Fatal Error ${shop.name}: ${e.message}`];
    }
  };

  try {
    // 全店舗を一斉に実行開始！
    const allResults = await Promise.all(TARGET_SHOPS.map(shop => processShop(shop)));
    const flatLogs = allResults.flat();
    return NextResponse.json({ success: true, logs: flatLogs });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}