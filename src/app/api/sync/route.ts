import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

// 診断したい問題児の店舗だけピックアップ
const DEBUG_SHOPS = [
  { id: '006', name: '池西', baseUrl: 'https://ikekari.com/attend.php' },
  { id: '004', name: '上野', baseUrl: 'https://www.karin360plus-ueno.com/attend.php' },
];

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log("🕵️‍♂️ 名探偵モード: 上野と池西の不具合を調査します...");

    // 1. DBから名簿を取得
    const { data: allCast } = await supabase.from('cast_members').select('login_id, hp_display_name, home_shop_id');
    
    for (const shop of DEBUG_SHOPS) {
      log(`\n--- 🏥 【${shop.name}】の診断 ---`);

      // DB上のメンバーを探す（曖昧検索）
      const dbMembers = allCast?.filter(c => {
        const sid = String(c.home_shop_id).trim();
        return sid === shop.id || sid === String(parseInt(shop.id));
      }) || [];

      log(`📚 DB登録数: ${dbMembers.length}人`);
      if (dbMembers.length > 0) {
        log(`   (例: ${dbMembers.slice(0, 3).map(c => c.hp_display_name).join(', ')} ... )`);
      } else {
        log(`❌ 致命的: DBに ${shop.name} のキャストがいません！IDが合っていません。`);
        continue;
      }

      // Webサイトを見に行く
      const targetDate = format(new Date(), 'yyyy/MM/dd');
      const url = `${shop.baseUrl}?date_get=${targetDate}`;
      log(`🌍 サイトアクセス: ${url}`);

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        log(`❌ サイトに繋がりません: ${res.status}`);
        continue;
      }
      
      const html = await res.text();
      const $ = cheerio.load(html);

      // HTMLから名前を抽出してみる
      const foundNames: string[] = [];
      // 色々なパターンで探ってみる
      $('li h3, li .name, .dataBox h3, .dataBox .name, .cast_name').each((_, el) => {
        const t = $(el).text().trim().replace(/\s+/g, '');
        if (t) foundNames.push(t);
      });

      log(`🔍 サイトから検出した名前: ${foundNames.length}件`);
      if (foundNames.length > 0) {
        log(`   (例: ${foundNames.slice(0, 5).join(', ')} ... )`);
        
        // マッチングテスト
        let matchCount = 0;
        const normalize = (n: string) => n.replace(/[（\(\[].*?[）\)\]]/g, '').replace(/\d+/g, '').trim();

        foundNames.slice(0, 5).forEach(webName => {
          const cleanWeb = normalize(webName);
          const match = dbMembers.find(db => normalize(db.hp_display_name) === cleanWeb);
          if (match) {
            log(`   ✅ 一致: Web[${webName}] == DB[${match.hp_display_name}]`);
            matchCount++;
          } else {
            log(`   ⚠️ 不一致: Web[${webName}] (整形後:${cleanWeb}) はDBにいません`);
          }
        });
      } else {
        log(`❌ サイトから名前が1つも取れませんでした。HTML構造が違うようです。`);
        log(`   (HTMLの一部: ${html.slice(0, 200)}...)`);
      }
    }

    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}