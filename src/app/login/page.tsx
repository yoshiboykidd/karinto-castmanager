import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { addDays, format } from 'date-fns';

// タイムアウトを最大まで伸ばす
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
  { id: '010', name: '大久保', baseUrl: 'https://www.ookubo-karinto.com/attend.php' },
  { id: '011', name: '池東', baseUrl: 'https://www.karin10bukuro-3shine.com/attend.php' }, 
  { id: '012', name: '小岩', baseUrl: 'https://www.karin10koiwa.com/attend.php' }, 
];

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const JST_OFFSET = 9 * 60 * 60 * 1000;

  const processShop = async (shop: typeof TARGET_SHOPS[0]) => {
    let localLogs: string[] = [];

    try {
      // 1. 名簿取得
      const { data: castList, error: castError } = await supabase
        .from('cast_members')
        .select('login_id, hp_display_name')
        .eq('home_shop_id', shop.id);

      if (castError || !castList || castList.length === 0) {
        return [`⚠️ Skip ${shop.name}: 名簿取得失敗`];
      }

      const normalize = (val: string) => {
        if (!val) return "";
        let s = val.replace(/\s+/g, '').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/（\d+）/g, ''); 
        return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
      };

      // IDをString化してMap作成
      const nameMap = new Map(castList.map(c => [normalize(c.hp_display_name), String(c.login_id)]));

      // 7日分のPromiseを作成
      const dayPromises = Array.from({ length: 7 }).map(async (_, i) => {
        const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
        const dateStrDB = format(targetDate, 'yyyy-MM-dd');
        const dateStrURL = format(targetDate, 'yyyy/MM/dd');
        const url = `${shop.baseUrl}?date_get=${dateStrURL}&t=${Date.now()}`;

        try {
          // ★修正ポイント：タイムアウト設定 (5秒以上かかったら諦めて次へ行く)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒制限

          const res = await fetch(url, { 
            cache: 'no-store',
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));

          if (!res.ok) return null;
          const html = await res.text();
          const $ = cheerio.load(html);

          // 既存データの取得
          const { data: existingShifts } = await supabase
            .from('shifts')
            .select('login_id, status')
            .eq('shift_date', dateStrDB);

          const existingStatusMap = new Map(existingShifts?.map(s => [String(s.login_id), s.status]));
          
          const batchData: any[] = [];

          $('li').each((_, element) => {
            const li = $(element);
            const cleanName = normalize(li.find('h3').text());
            const timeMatch = li.text().match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

            if (cleanName && timeMatch) {
              const loginId = nameMap.get(cleanName);
              if (loginId) {
                const currentStatus = existingStatusMap.get(loginId);
                
                const hpStart = timeMatch[1].padStart(5, '0');
                const hpEnd = timeMatch[2].padStart(5, '0');

                // ★修正ポイント：確実に shift_date を含むオブジェクトを作る
                const commonData = { 
                  login_id: loginId, 
                  shift_date: dateStrDB, // ← これが絶対に必要
                  hp_display_name: cleanName, 
                  is_official_pre_exist: true,
                  hp_start_time: hpStart, 
                  hp_end_time: hpEnd      
                };
                
                if (currentStatus === 'requested') {
                  // 申請中の場合は commonData (HP時間情報) だけ更新
                  batchData.push(commonData);
                } else {
                  // 通常時は commonData + 公式確定情報 で更新
                  batchData.push({
                    ...commonData,
                    start_time: hpStart,
                    end_time: hpEnd,
                    status: 'official',
                    is_official: true
                  });
                }
              }
            }
          });

          if (batchData.length > 0) {
            const { error } = await supabase.from('shifts').upsert(batchData, { onConflict: 'login_id, shift_date' });
            if (error) {
              console.error(`DB Error ${shop.name} ${dateStrDB}:`, error);
              return `❌ ${shop.name} ${dateStrDB} DB Error`;
            }
            return `✅ ${shop.name} ${format(targetDate, 'MM/dd')} (${batchData.length}件)`;
          }
          return null;
        } catch (err: any) {
          if (err.name === 'AbortError') {
             return `⏱️ ${shop.name} ${format(targetDate, 'MM/dd')} Timeout`;
          }
          return `❌ ${shop.name} ${dateStrDB} Error`;
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
    const allResults = await Promise.all(TARGET_SHOPS.map(shop => processShop(shop)));
    const flatLogs = allResults.flat();

    // ログ更新
    await supabase
      .from('sync_logs')
      .upsert({ 
        id: 1, 
        last_sync_at: new Date().toISOString() 
      });

    return NextResponse.json({ success: true, logs: flatLogs });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}