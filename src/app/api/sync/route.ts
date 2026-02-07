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
          const timeoutId = setTimeout(() => controller.abort(), 6000); // タイムアウト延長

          // ★修正: User-Agentを追加してブラウザのふりをする
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
          const foundLoginIds = new Set<string>(); // 「HPに名前があった人」リスト
          const debugTimeErrors: string[] = []; // 時間が読めなかった人のリスト

          // ★修正: 時間正規表現をさらに緩く (数字とコロンさえあれば拾う)
          // 例: "12:00～21:00", "12:00 - 21:00", "12:0021:00" など
          const timeRegex = /(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/;

          const tryAddShift = (rawName: string, timeText: string) => {
            const cleanName = normalize(rawName);
            const loginId = nameMap.get(cleanName);

            if (loginId) {
              // ★重要: 名前が見つかった時点で「発見」とする（時間が読めなくても削除しない！）
              foundLoginIds.add(loginId);

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
              } else {
                // 名前はあるけど時間が読めなかった場合ログに残す
                if (timeText.trim() !== "" && timeText.includes(":")) {
                   debugTimeErrors.push(`${cleanName}[${timeText}]`);
                }
              }
            }
          };

          // スクレイピング実行
          // セレクタを広げて、liタグだけでなく .dataBox 内も探す
          $('li').each((_, element) => { tryAddShift($(element).find('h3').text(), $(element).text()); });
          $('.dataBox').each((_, element) => {
             const box = $(element);
             const name = box.find('h3').text() || box.find('.name').text() || "";
             const time = box.text();
             tryAddShift(name, time);
          });

          // 削除・リセットロジック
          const deleteIds: string[] = [];
          const resetRequestIds: any[] = [];

          if (existingShifts) {
            existingShifts.forEach((shift) => {
              const sId = String(shift.login_id);
              
              // 「DBにある」かつ「今回名前が見つからなかった」場合のみ削除候補
              if (!foundLoginIds.has(sId)) {
                if (shift.status === 'official') {
                  deleteIds.push(sId);
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

          // DB更新実行
          let logMsg = `✅ ${shop.name} ${format(targetDate, 'MM/dd')}`;
          let updateCount = 0;

          if (officialBatch.length > 0) {
            await supabase.from('shifts').upsert(officialBatch, { onConflict: 'login_id, shift_date' });
            updateCount += officialBatch.length;
          }
          if (requestedBatch.length > 0) {
            await supabase.from('shifts').upsert(requestedBatch, { onConflict: 'login_id, shift_date' });
            updateCount += requestedBatch.length;
          }
          if (deleteIds.length > 0) {
            await supabase.from('shifts').delete()
              .in('login_id', deleteIds)
              .eq('shift_date', dateStrDB)
              .eq('status', 'official'); 
            logMsg += ` (削除${deleteIds.length})`;
          }
          if (resetRequestIds.length > 0) {
            await supabase.from('shifts').upsert(resetRequestIds, { onConflict: 'login_id, shift_date' });
            logMsg += ` (リセット${resetRequestIds.length})`;
          }

          // 時間読み取りエラーがあればログに追加
          if (debugTimeErrors.length > 0) {
            logMsg += ` ⚠️時間不明: ${debugTimeErrors.join(', ')}`;
          }

          return `${logMsg} (更新${updateCount})`;

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
      await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() }, { onConflict: 'id' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const flatLogs = allResults.flat();
    return NextResponse.json({ success: true, logs: flatLogs });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}