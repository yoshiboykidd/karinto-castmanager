import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()

    // 1. shop_id (例: "006") を基に店舗マスターから Webhook URL を取得
    const formattedShopId = String(record.shop_id || "").padStart(3, '0')
    
    const { data: shopData } = await supabase
      .from('shop_master')
      .select('webhook_in_out')
      .eq('shop_id', formattedShopId) // 画像に基づき shop_id カラムを指定
      .single()

    const DISCORD_WEBHOOK_URL = shopData?.webhook_in_out || Deno.env.get('DISCORD_WEBHOOK_URL')

    if (!DISCORD_WEBHOOK_URL) {
      throw new Error(`Webhook URL not found for shop_id: ${formattedShopId}`)
    }

    // 2. ペイロードの作成（ご要望に合わせてタイトルを削除し本文のみに）
    const discordPayload = {
      content: `${record.content}`, 
    }

    // 3. Discordへ送信
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