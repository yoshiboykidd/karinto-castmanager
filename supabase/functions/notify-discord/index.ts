import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Supabaseクライアントの初期化
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()

    // 2. 通知タイプに応じたタイトルの決定
    const getEmoji = (type: string) => {
      switch (type) {
        case 'in_out': return '🚗 【イン/アウト】'
        case 'help':   return '🆘 【ヘルプ】'
        default:       return '📢 【通知】'
      }
    }

    // 3. shop_id (例: "006") を基に店舗マスターから Webhook URL を取得
    // フロントから数値で届く可能性も考慮し padStart で 3桁に固定
    const formattedShopId = String(record.shop_id || "").padStart(3, '0')
    
    const { data: shopData } = await supabase
      .from('shop_master')
      .select('webhook_in_out')
      .eq('id', formattedShopId)
      .single()

    // 店舗固有の設定があれば優先、なければ共通の環境変数を使用
    const DISCORD_WEBHOOK_URL = shopData?.webhook_in_out || Deno.env.get('DISCORD_WEBHOOK_URL')

    if (!DISCORD_WEBHOOK_URL) {
      throw new Error(`Webhook URL not found for shop_id: ${formattedShopId}`)
    }

    // 4. ペイロードの作成
    const emojiAndTitle = getEmoji(record.type)
    const discordPayload = {
      content: `**${emojiAndTitle}**\n${record.content}`,
    }

    // 5. Discordへ送信
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})