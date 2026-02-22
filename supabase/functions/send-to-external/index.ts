import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  console.log("--- [送信プロセス開始] ---")
  try {
    const payload = await req.json()
    const record = payload.record
    if (!record) throw new Error("レコードが見つかりません")

    const searchId = String(record.cast_id).trim()
    console.log(`🔍 検索開始: login_id = [${searchId}]`)

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 診断用ログ：テーブル内のIDをサンプル抽出
    const { data: allCasts } = await supabase.from('cast_members').select('login_id').limit(5)
    console.log("📂 DB内のlogin_idサンプル:", JSON.stringify(allCasts))

    const { data: cast, error: castError } = await supabase
      .from('cast_members')
      .select('display_name, submission_email')
      .eq('login_id', searchId)
      .maybeSingle()

    if (castError) {
      console.error("❌ DBエラー:", castError.message)
      throw castError
    }

    if (!cast) {
      console.error(`❌ 不一致: "${searchId}" が見つかりません。`)
      return new Response(JSON.stringify({ error: `Not found: ${searchId}` }), { status: 404 })
    }

    console.log(`✅ 発見: ${cast.display_name}`)

    // Resend送信ロジック
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Karinto Manager <system@karinto-internal.com>',
        to: cast.submission_email,
        subject: `【写メ日記】${cast.display_name}様より投稿`,
        html: `<p>${(record.content || "").replace(/\n/g, '<br>')}</p>`,
      }),
    })
    
    const resData = await res.json()
    console.log("📧 Resend API Response:", JSON.stringify(resData))
    
    return new Response(JSON.stringify(resData), { status: 200 })

  } catch (error) {
    console.error("🔥 エラー:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})