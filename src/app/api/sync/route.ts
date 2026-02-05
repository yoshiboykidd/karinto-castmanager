import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { addDays, format } from 'date-fns';

// タイムアウト対策 (最大60秒)
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// ▼▼▼ 設定エリア: ここを実際の店舗URLに書き換えてください ▼▼▼
const TARGET_SHOPS = [
  { id: '001', name: '神田', baseUrl: 'https://www.kakarinto.com/attend.php' }, 
  { id: '002', name: '赤坂', baseUrl: 'https://www.akakari10.com/attend.php' }, 
  { id: '003', name: '秋葉原', baseUrl: 'https://www.akikarinto.com/attend.php' }, 
  { id: '004', name: '上野', baseUrl: 'https://www.karin360plus-ueno.com/attend.php' }, 
  { id: '005', name: '渋谷', baseUrl: 'https://www.shibuyakarinto.com/attend.php' }, 
  { id: '006', name: '池西', baseUrl: 'https://ikekari.com/attend.php' }, 
  { id: '007', name: '五反田', baseUrl: 'https://www.karin-go.com/attend.php' }, 
  { id: '008', name: '大宮', baseUrl: 'https://www.karin10omiya.com/attend.php' }, 
  { id: '007', name: '吉祥寺', baseUrl: 'https://www.kari-kichi.com/attend.php' }, 
  //{ id: '009', name: '大久保', baseUrl: 'https://www.ookubo-karinto.com/attend.php' }, 
  { id: '010', name: '池東', baseUrl: 'https://www.karin10bukuro-3shine.com/attend.php' }, 
  { id: '012', name: '小岩', baseUrl: 'https://www.karin10koiwa.com/attend.php' }, 
  // ... 他の店舗もここに追加
];
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let logs: string[] = [];
  const JST_OFFSET = 9 * 60 * 60 * 1000;

  try {
    for (const shop of TARGET_SHOPS) {
      logs.push(`🏁 Check Shop: ${shop.name}`);

      // 1. 名簿取得
      const { data: castList } = await supabase
        .from('cast_members')
        .select('login_id, hp_display_name')
        .eq('home_shop_id', shop.id);

      if (!castList || castList.length === 0) {
        logs.push(`  ⚠️ 名簿なし: ${shop.name}`);
        continue;
      }

      // 名前正規化 (Python版ロジック移植)
      const normalize = (val: string) => {
        if (!val) return "";
        let s = val.replace(/\s+/g, '').replace(/[（\(\[].*?[）\)\]]/g, ''); 
        s = s.replace(/（\d+）/g, ''); 
        return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
      };

      const nameMap = new Map();
      castList.forEach(c => nameMap.set(normalize(c.hp_display_name), c.login_id));

      // 2. 向こう7日間ループ
      for (let i = 0; i < 7; i++) {
        const targetDate = addDays(new Date(Date.now() + JST_OFFSET), i);
        const dateStrDB = format(targetDate, 'yyyy-MM-dd');
        const dateStrURL = format(targetDate, 'yyyy/MM/dd');

        const url = `${shop.baseUrl}?date_get=${dateStrURL}&t=${Date.now()}`;
        
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          
          const html = await res.text();
          const $ = cheerio.load(html);

          // 既存シフト確認
          const { data: existingShifts } = await supabase
            .from('shifts')
            .select('cast_id, status')
            .eq('shop_id', shop.id)
            .eq('date', dateStrDB);

          const existingStatusMap = new Map();
          existingShifts?.forEach(s => existingStatusMap.set(s.cast_id, s.status));

          const batchData: any[] = [];

          $('li').each((_, element) => {
            const li = $(element);
            const rawName = li.find('h3').text();
            const cleanName = normalize(rawName);
            const text = li.text();
            const timeMatch = text.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/); // 柔軟な正規表現

            if (cleanName && timeMatch) {
              const castId = nameMap.get(cleanName);
              if (castId) {
                const currentStatus = existingStatusMap.get(castId);
                
                // 🔥 賢いロジック: 申請中は上書きしない
                if (currentStatus === 'requested') {
                  batchData.push({
                    cast_id: castId,
                    shop_id: shop.id,
                    date: dateStrDB,
                    is_official_pre_exist: true 
                  });
                  logs.push(`    🛡 Keep Request: ${cleanName}`);
                } else {
                  batchData.push({
                    cast_id: castId,
                    shop_id: shop.id,
                    date: dateStrDB,
                    start_time: timeMatch[1].padStart(5, '0'),
                    end_time: timeMatch[2].padStart(5, '0'),
                    status: 'official',
                    is_official: true,
                    is_official_pre_exist: true
                  });
                }
              }
            }
          });

          if (batchData.length > 0) {
            const { error } = await supabase
              .from('shifts')
              .upsert(batchData, { onConflict: 'cast_id, date' });
            
            if (!error) {
              logs.push(`  ✅ ${shop.name} (${dateStrDB}): ${batchData.length}件 同期`);
            }
          }

        } catch (e: any) {
          logs.push(`  ❌ Error: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}