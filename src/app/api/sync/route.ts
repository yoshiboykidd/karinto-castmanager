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
  { id: '008', name: '大宮', baseUrl: 'https://www.karin10omiya.com/attend.php' }, 
  { id: '009', name: '吉祥寺', baseUrl: 'https://www.kari-kichi.com/attend.php' },
  { id: '010', name: '大久保', baseUrl: 'https://www.ookubo-karinto.com/attend.php' },
  { id: '011', name: '池東', baseUrl: 'https://www.karin10bukuro-3shine.com/attend.php' }, 
  { id: '012', name: '小岩', baseUrl: 'https://www.karin10koiwa.com/attend.php' }, 
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const group = searchParams.get('group');

  let targetShops = [];
  if (group === '1') targetShops = ALL_SHOPS.slice(0, 3);
  else if (group === '2') targetShops = ALL_SHOPS.slice(3, 6);
  else if (group === '3') targetShops = ALL_SHOPS.slice(6, 9);
  else if (group === '4') targetShops = ALL_SHOPS.slice(9, 12);
  else targetShops = ALL_SHOPS;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const JST_OFFSET = 9 * 60 * 60 * 1000;

  const processShop = async (shop: typeof ALL_SHOPS[0]) => {
    let localLogs: string[] = [];

    try {
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

      const nameMap = new Map(castList.map(c => [normalize(c.hp_display_name), String(c.login_id)]));

      const dayPromises = Array.from({ length: 7 }).map(async (_, i) => {
        const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
        const dateStrDB = format(targetDate, 'yyyy-MM-dd');
        const dateStrURL = format(targetDate, 'yyyy/MM/dd');
        const url = `${shop.baseUrl}?date_get=${dateStrURL}&t=${Date.now()}`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000); 

          const res = await fetch(url, { 
            cache: 'no-store',
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));

          if (!res.ok) return `❌ ${shop.name} ${format(targetDate, 'MM/dd')} HTTP Error`;
          
          const html = await res.text();
          const $ = cheerio.load(html);

          const { data: existingShifts } = await supabase
            .from('shifts')
            .select('login_id, status')
            .eq('shift_date', dateStrDB);

          const existingStatusMap = new Map(existingShifts?.map(s => [String(s.login_id), s.status]));
          
          const officialBatch: any[] = [];
          const requestedBatch: any[] = [];
          
          // ★追加: HPで見つかった人のIDを記録するセット
          const foundLoginIds = new Set<string>();

          const tryAddShift = (rawName: string, timeText: string) => {
            const cleanName = normalize(rawName);
            const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

            if (cleanName && timeMatch) {
              const loginId = nameMap.get(cleanName);
              if (loginId) {
                // ★追加: 「この人はHPにいたよ」とマーク
                foundLoginIds.add(loginId);

                const currentStatus = existingStatusMap.get(loginId);
                const hpStart = timeMatch[1].padStart(5, '0');
                const hpEnd = timeMatch[2].padStart(5, '0');

                if (currentStatus === 'requested') {
                  // 申請中の場合は裏の時間だけ更新
                  requestedBatch.push({
                    login_id: loginId,
                    shift_date: dateStrDB,
                    hp_display_name: cleanName,
                    is_official_pre_exist: true,
                    hp_start_time: hpStart,
                    hp_end_time: hpEnd
                  });
                } else {
                  // 確定の場合は全更新
                  officialBatch.push({
                    login_id: loginId,
                    shift_date: dateStrDB,
                    hp_display_name: cleanName,
                    is_official_pre_exist: true,
                    hp_start_time: hpStart,
                    hp_end_time: hpEnd,
                    start_time: hpStart,
                    end_time: hpEnd,
                    status: 'official',
                    is_official: true
                  });
                }
              }
            }
          };

          $('li').each((_, element) => { tryAddShift($(element).find('h3').text(), $(element).text()); });
          $('.dataBox').each((_, element) => {
            const box = $(element);
            let timeText = "";
            box.find('p').each((_, p) => {
                const t = $(p).text();
                if (/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(t)) {
                    timeText = t;
                    return false;
                }
            });
            tryAddShift(box.find('h3').text(), timeText);
          });

          // ★追加: HPから消えた人を削除するロジック
          const deleteIds: string[] = [];
          const resetRequestIds: any[] = [];

          if (existingShifts) {
            existingShifts.forEach((shift) => {
              const sId = String(shift.login_id);
              // DBにはあるのに、今回のHPスキャンで見つからなかった場合
              if (!foundLoginIds.has(sId)) {
                if (shift.status === 'official') {
                  // 確定シフトなら削除リストへ (お休みになった)
                  deleteIds.push(sId);
                } else if (shift.status === 'requested') {
                  // 申請中なら、HP時間を消して「新規申請」扱いに戻す (緑 -> 紫)
                  resetRequestIds.push({
                    login_id: sId,
                    shift_date: dateStrDB,
                    hp_start_time: null,
                    hp_end_time: null,
                    is_official_pre_exist: false
                  });
                }
              }
            });
          }

          // DB操作実行
          let logMsg = `✅ ${shop.name} ${format(targetDate, 'MM/dd')}`;
          let updateCount = 0;

          // 1. 確定シフト更新
          if (officialBatch.length > 0) {
            await supabase.from('shifts').upsert(officialBatch, { onConflict: 'login_id, shift_date' });
            updateCount += officialBatch.length;
          }
          // 2. 申請中シフト更新
          if (requestedBatch.length > 0) {
            await supabase.from('shifts').upsert(requestedBatch, { onConflict: 'login_id, shift_date' });
            updateCount += requestedBatch.length;
          }
          // 3. 消えた人を削除
          if (deleteIds.length > 0) {
            await supabase.from('shifts').delete()
              .in('login_id', deleteIds)
              .eq('shift_date', dateStrDB);
            logMsg += ` (削除${deleteIds.length}件)`;
          }
          // 4. 申請中の人のHP時間リセット
          if (resetRequestIds.length > 0) {
            await supabase.from('shifts').upsert(resetRequestIds, { onConflict: 'login_id, shift_date' });
          }

          if (updateCount === 0 && deleteIds.length === 0) {
            return `💤 ${shop.name} ${format(targetDate, 'MM/dd')} (変更なし)`;
          } else {
            return `${logMsg} (更新${updateCount}件)`;
          }

        } catch (err: any) {
          return `❌ Error: ${err.message}`;
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
    const allResults: string[][] = [];
    
    for (const shop of targetShops) {
      const shopLogs = await processShop(shop);
      allResults.push(shopLogs);
      
      const nowISO = new Date().toISOString();
      await supabase
        .from('sync_logs')
        .upsert({ id: 1, last_sync_at: nowISO }, { onConflict: 'id' });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const flatLogs = allResults.flat();
    const diffSec = ((Date.now() - startTime) / 1000).toFixed(1);
    
    flatLogs.push(`🏁 Group ${group || 'ALL'} 完了！所要時間: ${diffSec}秒`);

    return NextResponse.json({ success: true, group: group, logs: flatLogs });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}