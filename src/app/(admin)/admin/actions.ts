'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 【共通】権限に基づいたキャスト一覧の取得
 * ダッシュボードや統計画面など、メンバー管理以外でも使う場合はここに残します
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

// 📍 注意: createCast（登録ロジック）は members/actions.ts に移行したため、ここからは削除しました。