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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const JST_OFFSET = 9 * 60 * 60 * 1000;
  const searchParams = request.nextUrl.searchParams;
  const group = searchParams.get('group');

  let targetShops = [];
  if (group === '1') targetShops = ALL_SHOPS.slice(0, 3);
  else if (group === '2') targetShops = ALL_SHOPS.slice(3, 6);
  else if (group === '3') targetShops = ALL_SHOPS.slice(6, 9);
  else if (group === '4') targetShops = ALL_SHOPS.slice(9, 12);
  else targetShops = ALL_SHOPS;

  const processShop = async (shop: typeof ALL_SHOPS[0]) => {
    let localLogs: string[] = [];

    try {
      // 名簿取得
      const { data: castList, error: castError } = await supabase
        .from('cast_members')
        .select('login_id, hp_display_name')
        .eq('home_shop_id', shop.id);

      if (castError || !castList || castList.length === 0) {
        return [`⚠️ Skip ${shop.name}: 名簿なし`];
      }

      // 名前正規化関数
      const normalize = (val: string) => {
        if (!val) return "";
        return val.replace(/\s+/g, '') 
          .replace(/[（\(\[].*?[）\)\]]/g, '') 
          .replace(/\d+/g, '') 
          .replace(/[^\u3040-\u309F]/g, '') 
          .trim();
      };

      // ★重要: IDのマッピング（確実に8桁・空白なしにする）
      const nameMap = new Map(castList.map(c => [
        normalize(c.hp_display_name), 
        String(c.login_id).trim().padStart(8, '0') 
      ]));

      const dayPromises = Array.from({ length: 7 }).map(async (_, i) => {
        const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
        const dateStrDB = format(targetDate, 'yyyy-MM-dd');
        const dateStrURL = format(targetDate, 'yyyy/MM/dd');
        const url = `${shop.baseUrl}?date_get=${dateStrURL}&t=${Date.now()}`;

        try {
          // タイムアウト付きフェッチ
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); 
          const res = await fetch(url, { 
            cache: 'no-store',
            headers: { 'User-Agent': 'Mozilla/5.0...' },
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));

          if (!res.ok) return `❌ ${shop.name} HTTP ${res.status}`;
          
          const html = await res.text();
          const $ = cheerio.load(html);

          // 既存データの取得（更新判定用）
          const { data: existingShifts } = await supabase
            .from('shifts')
            .select('login_id, status')
            .eq('shift_date', dateStrDB);
          
          const existingStatusMap = new Map(existingShifts?.map(s => [
            String(s.login_id).trim().padStart(8, '0'), 
            s.status
          ]));
          
          const officialBatch: any[] = [];
          const requestedBatch: any[] = [];
          const foundLoginIds = new Set<string>();
          const timeRegex = /(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/;
          const nowISO = new Date().toISOString();

          // シフト追加ロジック
          const tryAddShift = (rawName: string, timeText: string) => {
            if (!rawName) return;
            const cleanName = normalize(rawName);
            if (!/^[ぁ-ん]{1,3}$/.test(cleanName)) return;

            const loginId = nameMap.get(cleanName);

            if (loginId) {
              foundLoginIds.add(loginId); 
              const timeMatch = timeText.match(timeRegex);
              if (timeMatch) {
                const currentStatus = existingStatusMap.get(loginId);
                const hpStart = timeMatch[1].padStart(5, '0');
                const hpEnd = timeMatch[2].padStart(5, '0');

                const shiftData = {
                  login_id: loginId,
                  shift_date: dateStrDB,
                  hp_display_name: cleanName,
                  is_official_pre_exist: true,
                  hp_start_time: hpStart,
                  hp_end_time: hpEnd,
                  updated_at: nowISO // 更新日時を現在に
                };

                if (currentStatus === 'requested') {
                  requestedBatch.push(shiftData);
                } else {
                  officialBatch.push({
                    ...shiftData,
                    start_time: hpStart,
                    end_time: hpEnd,
                    status: 'official',
                    is_official: true
                  });
                }
              }
            }
          };

          // スクレイピング実行
          $('li, .dataBox').each((_, el) => { 
            const name = $(el).find('h3').text() || $(el).find('.name').text() || "";
            const time = $(el).text(); 
            tryAddShift(name, time); 
          });

          // DB書き込み処理
          let updateCount = 0;
          if (officialBatch.length > 0) {
            // onConflict で強制上書き
            const { error } = await supabase
              .from('shifts')
              .upsert(officialBatch, { onConflict: 'login_id, shift_date' });
            if (!error) updateCount += officialBatch.length;
          }
          if (requestedBatch.length > 0) {
            await supabase
              .from('shifts')
              .upsert(requestedBatch, { onConflict: 'login_id, shift_date' });
            updateCount += requestedBatch.length;
          }

          // 削除処理（HPから消えた人の処理）
          const deleteIds: string[] = [];
          if (existingShifts) {
            existingShifts.forEach((shift) => {
              const sId = String(shift.login_id).trim().padStart(8, '0');
              if (!foundLoginIds.has(sId) && shift.status === 'official') {
                deleteIds.push(sId);
              }
            });
          }
          
          if (deleteIds.length > 0) {
             const currentShiftCount = existingShifts?.length || 0;
             // 安全装置: 全削除にならない場合のみ実行
             if (currentShiftCount < 5 || (deleteIds.length / currentShiftCount) < 0.8 || officialBatch.length > 0) {
               await supabase.from('shifts').delete().in('login_id', deleteIds).eq('shift_date', dateStrDB).eq('status', 'official');
             }
          }

          if (updateCount === 0 && deleteIds.length === 0) {
            return `💤 ${shop.name} ${format(targetDate, 'MM/dd')} (変化なし)`;
          }
          return `✅ ${shop.name} ${format(targetDate, 'MM/dd')} (更新${updateCount})`;

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
      // ログ更新
      const nowISO = new Date().toISOString();
      await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: nowISO }, { onConflict: 'id' });
    }
    return NextResponse.json({ success: true, logs: allResults.flat() });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}