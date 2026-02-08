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

function toHiragana(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60));
}

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  const group = request.nextUrl.searchParams.get('group');

  let targetShops = group === '1' ? ALL_SHOPS.slice(0, 3) : group === '2' ? ALL_SHOPS.slice(3, 6) : group === '3' ? ALL_SHOPS.slice(6, 9) : group === '4' ? ALL_SHOPS.slice(9, 12) : ALL_SHOPS;

  try {
    const { data: allCast } = await supabase.from('cast_members').select('login_id, hp_display_name, home_shop_id');
    const logs: string[] = [];

    for (const shop of targetShops) {
      const shopCast = allCast?.filter(c => String(c.home_shop_id).trim().padStart(3, '0') === shop.id || String(parseInt(c.home_shop_id || '0')) === String(parseInt(shop.id))) || [];

      const normalize = (val: string) => {
        if (!val) return "";
        let s = val
          .normalize('NFKC')
          .replace(/[（\(\[].*?[）\)\]]/g, '') // 括弧内削除
          .replace(/[\n\r\t]/g, '')           // ★改行・タブを完全に消去
          .replace(/[\d\s\u3000]+/g, '')      // 数字・空白（全角含）削除
          .replace(/[^\p{L}\p{N}]/gu, '')     // 絵文字等削除
          .trim();
        return toHiragana(s);
      };

      const nameMap = new Map(shopCast.map(c => [normalize(c.hp_display_name), String(c.login_id).trim().padStart(8, '0')]));

      const dayPromises = Array.from({ length: 7 }).map(async (_, i) => {
        const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
        const dateStrDB = format(targetDate, 'yyyy-MM-dd');
        const url = `${shop.baseUrl}?date_get=${format(targetDate, 'yyyy/MM/dd')}&t=${Date.now()}`;

        try {
          const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) return `❌ ${shop.name} HTTP ${res.status}`;
          const $ = cheerio.load(await res.text());

          const { data: existing } = await supabase.from('shifts').select('login_id, status').eq('shift_date', dateStrDB);
          const existingStatusMap = new Map(existing?.map(s => [String(s.login_id).trim().padStart(8, '0'), s.status]));
          
          const officialBatch: any[] = [];
          const requestedBatch: any[] = [];
          const foundLoginIds = new Set<string>();
          const unmatchedNames = new Set<string>();
          const timeRegex = /(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/;

          $('h3, .name, .cast_name, span.name, div.name, strong').each((_, nameEl) => {
            const rawName = $(nameEl).text();
            const cleanName = normalize(rawName);
            if (!cleanName) return;

            const loginId = nameMap.get(cleanName);
            if (!loginId) {
              if (!rawName.includes('時間') && rawName.length < 15) unmatchedNames.add(cleanName);
              return;
            }
            if (foundLoginIds.has(loginId)) return;

            const context = $(nameEl).text() + " " + $(nameEl).parent().text() + " " + $(nameEl).parent().parent().text();
            const timeMatch = context.match(timeRegex);

            if (timeMatch) {
              foundLoginIds.add(loginId);
              const data = {
                login_id: loginId, shift_date: dateStrDB, hp_display_name: cleanName,
                is_official_pre_exist: true, hp_start_time: timeMatch[1].padStart(5, '0'), hp_end_time: timeMatch[2].padStart(5, '0'), updated_at: new Date().toISOString()
              };
              if (existingStatusMap.get(loginId) === 'requested') requestedBatch.push(data);
              else officialBatch.push({ ...data, start_time: data.hp_start_time, end_time: data.hp_end_time, status: 'official', is_official: true });
            }
          });

          if (officialBatch.length > 0) await supabase.from('shifts').upsert(officialBatch, { onConflict: 'login_id, shift_date' });
          if (requestedBatch.length > 0) await supabase.from('shifts').upsert(requestedBatch, { onConflict: 'login_id, shift_date' });

          let logMsg = `✅ ${shop.name} ${format(targetDate, 'MM/dd')} (更新${officialBatch.length + requestedBatch.length})`;
          if (unmatchedNames.size > 0) logMsg += ` ⚠️ 不一致: [${Array.from(unmatchedNames).join(', ')}]`;
          return logMsg;
        } catch (e: any) { return `❌ Err ${shop.name}: ${e.message}`; }
      });

      logs.push(...(await Promise.all(dayPromises)));
    }
    return NextResponse.json({ success: true, logs });
  } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}