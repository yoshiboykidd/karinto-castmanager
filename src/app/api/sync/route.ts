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

export async function GET(req: NextRequest) {
  // 📍 修正1：認証チェックのログを強化（cron-job.org対策）
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Auth Fail: Header is " + authHeader);
      return NextResponse.json({ success: false, message: "Unauthorized: Secret mismatch" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const shopIdx = parseInt(searchParams.get('shop') || '-1');
  if (shopIdx < 0 || shopIdx >= ALL_SHOPS.length) {
    return NextResponse.json({ success: false, message: "Valid 'shop' index required." }, { status: 400 });
  }

  const shop = ALL_SHOPS[shopIdx];
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const JST_OFFSET = 9 * 60 * 60 * 1000;

  try {
    const { data: allCast } = await supabase.from('cast_members').select('login_id, hp_display_name, display_name, home_shop_id');
    const logs: string[] = [];

    const normalize = (val: string) => {
      if (!val) return "";
      let s = val.normalize('NFKC')
        .replace(/[（\(\[].*?[）\)\]]/g, '')
        .replace(/[\n\r\t\s\u3000]+/g, '')
        .replace(/[^\p{L}\p{N}]/gu, '')
        .trim();
      return toHiragana(s);
    };

    const shopCast = allCast?.filter(c => Number(c.home_shop_id) === Number(shop.id)) || [];
    const nameMap = new Map();
    shopCast.forEach(c => {
      const lid = String(c.login_id).trim().padStart(8, '0');
      nameMap.set(normalize(c.hp_display_name || c.display_name), lid);
    });

    for (let i = 0; i < 8; i++) {
      const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
      const dateStrDB = format(targetDate, 'yyyy-MM-dd');
      const url = `${shop.baseUrl}?date_get=${format(targetDate, 'yyyy/MM/dd')}&t=${Date.now()}`;

      try {
        const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) { logs.push(`${dateStrDB.slice(8)}日 HTTP ${res.status}`); continue; }
        
        const $ = cheerio.load(await res.text());
        const foundInHP = new Set<string>();
        const upsertBatch: any[] = [];
        const timeRegex = /(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/;

        const { data: existingShifts } = await supabase
          .from('shifts')
          .select('login_id, status, start_time, end_time, reward_amount')
          .eq('shift_date', dateStrDB);
        
        const existingMap = new Map(existingShifts?.map(s => [String(s.login_id).trim().padStart(8, '0'), s]));

        $('h3, .name, .cast_name, span.name, div.name, strong, td, a').each((_, nameEl) => {
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
            if (dbShift?.status === 'absent') return;

            // 📍 修正2：reward_amount の制約エラーを回避（既存値があれば維持、なければ0）
            upsertBatch.push({
              login_id: loginId,
              shift_date: dateStrDB,
              status: 'official',
              is_official: true,
              hp_start_time: hpStart,
              hp_end_time: hpEnd,
              start_time: hpStart,
              end_time: hpEnd,
              reward_amount: dbShift?.reward_amount ?? 0,
              updated_at: new Date().toISOString()
            });
          }
        });

        if (upsertBatch.length > 0) {
          const { error: upsertError } = await supabase
            .from('shifts')
            .upsert(upsertBatch, { onConflict: 'login_id, shift_date' });
          
          if (upsertError) {
            logs.push(`${dateStrDB.slice(8)}日 ERR:${upsertError.code}`);
          } else {
            logs.push(`${dateStrDB.slice(8)}日(HP:${foundInHP.size}/更:${upsertBatch.length})`);
          }
        } else {
          logs.push(`${dateStrDB.slice(8)}日(HP:0)`);
        }
      } catch (e: any) { logs.push(`${dateStrDB.slice(8)}日 Error`); }
    }

    return NextResponse.json({ success: true, shop: shop.name, logs });
  } catch (e: any) { 
    return NextResponse.json({ success: false, message: e.message }, { status: 500 }); 
  }
}