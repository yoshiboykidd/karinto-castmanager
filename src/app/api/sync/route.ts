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
        return [`⚠️ Skip ${shop.name}: 名簿なし`];
      }

      // 名前正規化: スペース削除、カッコと中身を削除、全角英数変換
      const normalize = (val: string) => {
        if (!val) return "";
        let s = val
          .replace(/\s+/g, '') // スペース
          .replace(/[（\(\[].*?[）\)\]]/g, '') // カッコとその中身（年齢など）を全削除
          .replace(/\d+/g, '') // 残った数字も削除
          .replace(/[^\u3040-\u309F]/g, '') // ★最強: ひらがな以外をすべて削除（記号なども消す）
          .trim();
        return s;
      };

      const nameMap = new Map(castList.map(c => [normalize(c.hp_display_name), String(c.login_id)]));

      const dayPromises = Array.from({ length: 7 }).map(async (_, i) => {
        const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
        const dateStrDB = format(targetDate, 'yyyy-MM-dd');
        const dateStrURL = format(targetDate, 'yyyy/MM/dd');
        const url = `${shop.baseUrl}?date_get=${dateStrURL}&t=${Date.now()}`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); 

          const res = await fetch(url, { 
            cache: 'no-store',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));

          if (!res.ok) return `❌ ${shop.name} HTTP ${res.status}`;
          
          const html = await res.text();
          const $ = cheerio.load(html);

          const { data: existingShifts } = await supabase
            .from('shifts')
            .select('login_id, status')
            .eq('shift_date', dateStrDB);

          const existingStatusMap = new Map(existingShifts?.map(s => [String(s.login_id), s.status]));
          
          const officialBatch: any[] = [];
          const requestedBatch: any[] = [];
          const foundLoginIds = new Set<string>();

          // 時間正規表現
          const timeRegex = /(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/;

          const tryAddShift = (rawName: string, timeText: string) => {
            if (!rawName) return;

            const cleanName = normalize(rawName);

            // ★絶対ルール: ひらがな1文字〜3文字以外は即却下
            // これでイベント名やコース名は確実に弾かれる
            if (!/^[ぁ-ん]{1,3}$/.test(cleanName)) return;

            const loginId = nameMap.get(cleanName);

            if (loginId) {
              foundLoginIds.add(loginId); // 名前があれば「発見」とする

              const timeMatch = timeText.match(timeRegex);
              if (timeMatch) {
                const currentStatus = existingStatusMap.get(loginId);
                const hpStart = timeMatch[1].padStart(5, '0');
                const hpEnd = timeMatch[2].padStart(5, '0');

                if (currentStatus === 'requested') {
                  requestedBatch.push({
                    login_id: loginId,
                    shift_date: dateStrDB,
                    hp_display_name: cleanName,
                    is_official_pre_exist: true,
                    hp_start_time: hpStart,
                    hp_end_time: hpEnd
                  });
                } else {
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

          $('li').each((_, element) => { 
            const name = $(element).find('h3').text();
            const time = $(element).text(); 
            tryAddShift(name, time); 
          });
          $('.dataBox').each((_, element) => {
             const box = $(element);
             const name = box.find('h3').text() || box.find('.name').text() || "";
             const time = box.text();
             tryAddShift(name, time);
          });

          // 削除候補の計算
          const deleteIds: string[] = [];
          const resetRequestIds: any[] = [];

          if (existingShifts) {
            existingShifts.forEach((shift) => {
              const sId = String(shift.login_id);
              // DBにあるのに、今回のスキャンで見つからなかった場合
              if (!foundLoginIds.has(sId)) {
                if (shift.status === 'official') {
                  deleteIds.push(sId); // 削除候補
                } else if (shift.status === 'requested') {
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

          let logMsg = `✅ ${shop.name} ${format(targetDate, 'MM/dd')}`;
          let updateCount = 0;

          // 1. 更新実行
          if (officialBatch.length > 0) {
            await supabase.from('shifts').upsert(officialBatch, { onConflict: 'login_id, shift_date' });
            updateCount += officialBatch.length;
          }
          if (requestedBatch.length > 0) {
            await supabase.from('shifts').upsert(requestedBatch, { onConflict: 'login_id, shift_date' });
            updateCount += requestedBatch.length;
          }

          // 2. 削除・リセット実行 (安全装置付き)
          const currentShiftCount = existingShifts?.length || 0;
          const isSafeToDelete = currentShiftCount < 5 || (deleteIds.length / currentShiftCount) < 0.8;

          if (isSafeToDelete) {
            if (deleteIds.length > 0) {
              await supabase.from('shifts').delete()
                .in('login_id', deleteIds)
                .eq('shift_date', dateStrDB)
                .eq('status', 'official'); 
              logMsg += ` (お休み反映:${deleteIds.length})`;
            }
            if (resetRequestIds.length > 0) {
              await supabase.from('shifts').upsert(resetRequestIds, { onConflict: 'login_id, shift_date' });
              logMsg += ` (申請中リセット:${resetRequestIds.length})`;
            }
          } else {
            logMsg += ` ⚠️削除停止(安全装置発動: ${deleteIds.length}/${currentShiftCount}が消失判定)`;
          }

          if (updateCount === 0 && deleteIds.length === 0) {
            return `💤 ${shop.name} ${format(targetDate, 'MM/dd')} (変更なし)`;
          } else {
            return `${logMsg} (更新${updateCount})`;
          }

        } catch (err: any) {
          return `❌ Err ${shop.name}: ${err.message}`;
        }
      });

      const dayResults = await Promise.all(dayPromises);
      localLogs.push(...dayResults.filter((r): r is string => r !== null));
      return localLogs;

    } catch (e: any) {
      return [`❌ Fatal ${shop.name}: ${e.message}`];
    }
  };

  try {
    const allResults: string[][] = [];
    for (const shop of targetShops) {
      const shopLogs = await processShop(shop);
      allResults.push(shopLogs);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const flatLogs = allResults.flat();
    return NextResponse.json({ success: true, logs: flatLogs });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}