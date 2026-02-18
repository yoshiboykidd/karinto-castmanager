import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 通知の種類に応じた表示設定 [cite: 2026-01-29]
const getEmoji = (type: string) => {
  switch (type) {
    case 'in_out':     return '🚗 【イン/アウト】';
    case 'attendance': return '📅 【出勤確認】';
    case 'shift':      return '📝 【シフト申請】';
    case 'help':       return '🆘 【ヘルプ要請】';
    default:           return '📢 【通知】';
  }
}

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 💡 店舗IDを3桁の文字列に変換 (例: 11 → "011") [cite: 2026-01-29]
    const formattedShopId = String(record.shop_id).padStart(3, '0');
    console.log(`Processing: Shop ID ${formattedShopId}`);

    // 3. shop_masterテーブルから情報を取得 (カラム名は shop_id を使用) [cite: 2026-01-29]
    const { data: shop, error: shopError } = await supabaseClient
      .from('shop_master')
      .select('shop_name, webhook_in_out, webhook_attendance, webhook_shift, webhook_help')
      .eq('shop_id', formattedShopId) 
      .maybeSingle();

    if (shopError) throw new Error(`DB Error: ${shopError.message}`);

    if (!shop) {
      console.error(`Shop ID ${formattedShopId} not found in shop_master.`);
      return new Response(`Shop ${formattedShopId} not found`, { status: 404 });
    }

    // 4. 通知タイプに合わせて送信先URLを選択 [cite: 2026-01-29]
    let targetWebhookUrl = '';
    switch (record.type) {
      case 'in_out':     targetWebhookUrl = shop.webhook_in_out; break;
      case 'attendance': targetWebhookUrl = shop.webhook_attendance; break;
      case 'shift':      targetWebhookUrl = shop.webhook_shift; break;
      case 'help':       targetWebhookUrl = shop.webhook_help; break;
    }

    if (!targetWebhookUrl) {
      console.log(`Webhook URL for ${record.type} is missing for ${shop.shop_name}.`);
      return new Response('Webhook URL not set', { status: 200 });
    }

    // 5. Discord用メッセージ作成
    const emojiAndTitle = getEmoji(record.type);
    const discordPayload = {
      content: `**${emojiAndTitle}**\n**店舗:** ${shop.shop_name}\n**内容:** ${record.content}`,
    };

    // 6. Discordへ送信
    const res = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!res.ok) throw new Error(`Discord API Error: ${await res.text()}`);

    return new Response(`OK: Sent to ${shop.shop_name}`, { status: 200 });

  } catch (err: any) {
    console.error('Worker Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})