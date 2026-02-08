'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function createCast(formData: FormData) {
  // 1. 特権キーでSupabaseに接続
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // .env.localの管理者キー
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const display_name = formData.get('display_name') as string
  const home_shop_id = formData.get('home_shop_id') as string
  const personal_number = formData.get('personal_number') as string
  
  // パスワードは「0000」で固定（運用ルール準拠）
  const default_password = "0000";

  if (!display_name || !home_shop_id || !personal_number) {
    return { error: '未入力の項目があります' }
  }

  // 2. ID生成 (店番3桁 + 個人番5桁)
  const formattedNumber = personal_number.padStart(5, '0');
  const login_id = `${home_shop_id}${formattedNumber}`;

  // 3. 重複チェック
  // 既にこのIDが使われていないかDBを確認
  const { data: existingUser } = await supabaseAdmin
    .from('cast_members')
    .select('display_name')
    .eq('login_id', login_id)
    .single();

  if (existingUser) {
    return { 
      error: `🚫 エラー: 番号「${personal_number}」は既に「${existingUser.display_name}」さんが使っています。別の番号にしてください。` 
    }
  }

  // 4. Supabase Auth (ログイン機能) 作成
  const email = `${login_id}@karinto-internal.com`
  
  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: default_password,
    email_confirm: true,
    user_metadata: { role: 'cast', home_shop_id: home_shop_id }
  })

  // Authだけ既に存在する場合のエラーハンドリング
  if (authError) {
    console.error('Auth Error:', authError)
    return { error: `ログイン作成失敗: ${authError.message}` }
  }

  // 5. DB (名簿) 登録
  const { error: dbError } = await supabaseAdmin
    .from('cast_members')
    .insert({
      login_id: login_id,
      display_name: display_name,
      hp_display_name: display_name,
      home_shop_id: home_shop_id,
      role: 'cast',
      password: 'managed_by_supabase' // DB上はダミー
    })

  if (dbError) {
    return { error: `名簿登録失敗: ${dbError.message}` }
  }

  revalidatePath('/admin')
  return { success: true, message: `✨ ${display_name}さん (No.${personal_number}) を登録しました！\n初期パスワードは「0000」です。` }
}