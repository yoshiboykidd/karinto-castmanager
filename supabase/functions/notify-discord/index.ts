import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { record } = await req.json()

    // 1. 通知タイプに応じた絵文字の決定 [cite: 2026-01-29]
    const getEmoji = (type: string) => {
      switch (type) {
        case 'in_out': return '🚗 【イン/アウト】'
        case 'help':   return '🆘 【ヘルプ】'
        default:       return '📢 【通知】'
      }
    }

    // 2. Discord Webhook URL の取得
    // ※店舗ごとにWebhookを変える場合はここでDBを参照
    const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL')

    if (!DISCORD_WEBHOOK_URL) {
      throw new Error('DISCORD_WEBHOOK_URL is not set')
    }

    // 📍 修正：ご要望のフォーマットに合わせて「店舗:」等のラベルを削除
    const emojiAndTitle = getEmoji(record.type)
    const discordPayload = {
      content: `**${emojiAndTitle}**\n${record.content}`,
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})