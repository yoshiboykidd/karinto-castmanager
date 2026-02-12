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
  
  const shopIdx = parseInt(request.nextUrl.searchParams.get('shop') || '-1');
  if (shopIdx < 0 || shopIdx >= ALL_SHOPS.length) {
    return NextResponse.json({ success: false, message: "Valid 'shop' index required." }, { status: 400 });
  }

  const shop = ALL_SHOPS[shopIdx];

  try {
    const { data: allCast } = await supabase.from('cast_members').select('login_id, hp_display_name, home_shop_id');
    const logs: string[] = [];

    const normalize = (val: string) => {
      if (!val) return "";
      let s = val.normalize('NFKC').replace(/[（\(\[].*?[）\)\]]/g, '').replace(/[\n\r\t\s\u3000]+/g, '').replace(/[^\p{L}\p{N}]/gu, '').trim();
      return toHiragana(s);
    };

    const shopCast = allCast?.filter(c => String(c.home_shop_id).trim().padStart(3, '0') === shop.id || String(parseInt(c.home_shop_id || '0')) === String(parseInt(shop.id))) || [];
    const nameMap = new Map(shopCast.map(c => [normalize(c.hp_display_name), String(c.login_id).trim().padStart(8, '0')]));
    
    for (let i = 0; i < 7; i++) {
      const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
      const dateStrDB = format(targetDate, 'yyyy-MM-dd');
      const url = `${shop.baseUrl}?date_get=${format(targetDate, 'yyyy/MM/dd')}&t=${Date.now()}`;

      try {
        const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) { logs.push(`${dateStrDB} HTTP ${res.status}`); continue; }
        
        const $ = cheerio.load(await res.text());
        const foundInHP = new Set<string>();
        const upsertBatch: any[] = [];
        const timeRegex = /(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/;

        const { data: existingShifts } = await supabase
          .from('shifts')
          .select('login_id, status, start_time, end_time')
          .eq('shift_date', dateStrDB)
          .like('login_id', `${shop.id}%`);
        
        const existingMap = new Map(existingShifts?.map(s => [String(s.login_id).trim().padStart(8, '0'), s]));

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

            // 申請保護ロジック
            if (dbShift?.status === 'requested') {
              if (dbShift.start_time !== hpStart || dbShift.end_time !== hpEnd) {
                return; 
              }
            }

            upsertBatch.push({
              login_id: loginId,
              shift_date: dateStrDB,
              store_code: shop.id, // 📍 修正：店舗コードを保存
              hp_display_name: cleanName,
              is_official_pre_exist: true,
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

        // 削除処理
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
      } catch (e: any) { logs.push(`${dateStrDB.slice(5)} Err`); }
    }

    await supabase.from('sync_logs').upsert({ id: 1, last_sync_at: new Date().toISOString() }, { onConflict: 'id' });

    return NextResponse.json({ success: true, shop: shop.name, logs });
  } catch (e: any) { 
    return NextResponse.json({ success: false, message: e.message }, { status: 500 }); 
  }
}