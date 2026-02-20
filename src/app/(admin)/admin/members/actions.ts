'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js' 
import { revalidatePath } from 'next/cache'

/**
 * 権限に基づいたキャスト一覧の取得
 */
export async function getFilteredMembers(selectedShopId: string = 'all') {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { members: [], myProfile: null }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) return { members: [], myProfile: null }

  let query = supabase.from('cast_members').select('*')

  if (currentUser.role === 'developer') {
    if (selectedShopId !== 'all') {
      query = query.eq('home_shop_id', selectedShopId)
    }
  } else if (currentUser.role === 'admin') {
    query = query.eq('home_shop_id', currentUser.home_shop_id)
  } else {
    return { members: [], myProfile: currentUser }
  }

  const { data: members, error } = await query
    .eq('role', 'cast')
    .order('login_id', { ascending: true })

  if (error) console.error(error)

  return { 
    members: members || [], 
    myProfile: {
      role: currentUser.role,
      home_shop_id: currentUser.home_shop_id
    }
  }
}

/**
 * キャストを新規登録する
 * 修正点: パスワードを 0000 -> 000000 (6文字) に変更
 */
export async function createCast(formData: FormData) {
  // 管理者権限を持つクライアントを作成 (Auth操作用)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const display_name = formData.get('display_name') as string
  const home_shop_id = formData.get('home_shop_id') as string
  const login_id = formData.get('personal_number') as string
  
  // 📍 修正: 初期パスワードを 000000 (6文字以上) に設定
  const default_password = "000000";

  if (!display_name || !home_shop_id || !login_id) {
    return { error: '未入力の項目があります' }
  }

  // 1. ID重複チェック
  const { data: existingUser } = await supabaseAdmin
    .from('cast_members')
    .select('display_name')
    .eq('login_id', login_id)
    .single();

  if (existingUser) {
    return { 
      error: `🚫 エラー: ID「${login_id}」は既に「${existingUser.display_name}」さんが使っています。` 
    }
  }

  // 2. Auth (ログインアカウント) 作成
  // 黄金律: [8桁ID]@karinto-internal.com
  const email = `${login_id}@karinto-internal.com`
  
  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: default_password,
    email_confirm: true,
    user_metadata: { role: 'cast', home_shop_id: home_shop_id }
  })

  if (authError) {
    return { error: `ログインアカウント作成失敗: ${authError.message}` }
  }

  // 3. DB (名簿テーブル) 登録
  const { error: dbError } = await supabaseAdmin
    .from('cast_members')
    .insert({
      login_id: login_id,
      display_name: display_name,
      hp_display_name: display_name,
      home_shop_id: home_shop_id,
      role: 'cast',
      password: 'managed_by_supabase'
    })

  if (dbError) {
    return { error: `名簿登録失敗: ${dbError.message}` }
  }

  revalidatePath('/admin/members')
  return { 
    success: true, 
    message: `✨ ${display_name}さん (ID:${login_id}) を登録しました！` 
  }
}

/**
 * キャストをDBから完全に削除する
 */
export async function deleteMember(loginId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { error } = await supabase
    .from('cast_members')
    .delete()
    .eq('login_id', loginId)

  if (error) {
    console.error('Delete error:', error)
    return { success: false }
  }

  revalidatePath('/admin/members')
  return { success: true }
}