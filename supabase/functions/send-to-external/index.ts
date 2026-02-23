import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record
    if (!record) throw new Error("レコードが見つかりません")

    const searchId = String(record.cast_id).trim()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const { data: cast } = await supabase
      .from('cast_members')
      .select('display_name, submission_email')
      .eq('login_id', searchId)
      .maybeSingle()

    if (!cast) return new Response(JSON.stringify({ error: "Cast not found" }), { status: 404 })

    // 画像の添付処理：image_url がある場合に実行
    const attachments = []
    if (record.image_url) {
      const imageRes = await fetch(record.image_url)
      const arrayBuffer = await imageRes.arrayBuffer()
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      attachments.push({
        filename: 'image.jpg',
        content: base64Content,
      })
    }

    // メールの送信（件名にタイトルを使用）
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Karinto Manager <system@karinto-internal.com>',
        to: cast.submission_email,
        subject: record.title || `【写メ日記】${cast.display_name}様より投稿`, // タイトルがあれば使用
        html: `<p>${(record.content || "").replace(/\n/g, '<br>')}</p>`,
        attachments: attachments, // 添付ファイルとして画像を追加
      }),
    })
    
    return new Response(JSON.stringify(await res.json()), { status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})