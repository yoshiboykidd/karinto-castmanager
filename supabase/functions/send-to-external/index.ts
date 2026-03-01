import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  console.log("🚀 [Edge Function] 送信プロセス開始")
  
  try {
    const payload = await req.json()
    const record = payload.record
    if (!record) throw new Error("Payload record is missing")

    console.log(`📝 投稿検知: cast_id=${record.cast_id}, title=${record.title}`)

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // キャスト情報の取得（確定済みのフィールド名を使用）
    const { data: cast, error: castError } = await supabase
      .from('cast_members')
      .select('display_name, submission_email')
      .eq('login_id', String(record.cast_id).trim())
      .maybeSingle()

    if (castError || !cast) throw new Error(`Cast not found: ${record.cast_id}`)

    const attachments = []
    // 📍 1枚目の画像を添付ファイル（サムネイル）として処理
    if (record.image_url) {
      try {
        const imageRes = await fetch(record.image_url)
        if (imageRes.ok) {
          const arrayBuffer = await imageRes.arrayBuffer()
          // 高速なBase64エンコードを使用して500エラーを回避
          const base64Content = encode(new Uint8Array(arrayBuffer))
          
          attachments.push({
            filename: 'thumbnail.jpg',
            content: base64Content,
          })
          console.log("📎 1枚目の画像を添付ファイル化しました")
        }
      } catch (err) {
        console.error("⚠️ 画像取得失敗（添付なしで継続）:", err.message)
      }
    }

    // --- ロジック修正箇所: 最初の<img>タグだけを削除 ---
    // /<img[^>]*>/ の後ろに "g" を付けないことで、最初の1つだけを置換します
    const cleanHtml = (record.content || "")
      .replace(/<img[^>]*>/, "") // 最初に見つかったimgタグのみを空文字に置換
      .replace(/\n/g, '<br>')    // 改行コードをHTML形式に変換

    // Resend送信
    console.log("📧 Resend APIへ送信リクエスト中...")
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Karinto Manager <system@karinto-internal.com>',
        to: cast.submission_email,
        // 自サイトで入力したタイトルを件名に反映
        subject: record.title || `【写メ日記】${cast.display_name}様より投稿`,
        html: `<div>${cleanHtml}</div>`,
        attachments: attachments,
      }),
    })

    const resData = await res.json()
    console.log("🏁 送信完了ログ:", JSON.stringify(resData))
    
    return new Response(JSON.stringify(resData), { status: 200 })

  } catch (error) {
    console.error("🔥 致命的エラー:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})