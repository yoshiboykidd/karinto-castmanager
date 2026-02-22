import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { record } = await req.json() // 📍 DBに挿入された日記データ [cite: 2026-02-21]

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. キャストの「外部サイト用アドレス」をDBから取得 [cite: 2026-02-21]
    const { data: cast, error: castError } = await supabase
      .from('cast_members')
      .select('submission_email, display_name')
      .eq('login_id', record.cast_id)
      .single()

    if (castError || !cast?.submission_email) {
      return new Response("送信先アドレスが未設定のキャストです。")
    }

    // 2. 画像をバイナリデータとして取得し、添付用に加工 [cite: 2026-02-21]
    let attachments = []
    if (record.image_url) {
      const imgRes = await fetch(record.image_url)
      const arrayBuffer = await imgRes.arrayBuffer()
      // Deno環境でバイナリをBase64文字列に変換 [cite: 2026-02-21]
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      attachments.push({
        filename: 'diary_photo.jpg',
        content: base64Content,
      })
    }

    // 3. Resend API で送信 [cite: 2026-02-21]
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Karinto Manager <system@karinto-internal.com>', // 📍Resendで認証したドメイン
        to: [cast.submission_email],
        subject: `【写メ日記】${cast.display_name}`,
        html: record.content, // [cite: 2026-02-21]
        attachments: attachments,
      }),
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), { status: 200 })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
