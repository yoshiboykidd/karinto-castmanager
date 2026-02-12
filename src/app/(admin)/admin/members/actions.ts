'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  // 1. 操作しているユーザーの権限を確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { members: [], myProfile: null }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) return { members: [], myProfile: null }

  // 2. クエリ構築
  let query = supabase.from('cast_members').select('*')

  if (currentUser.role === 'developer') {
    // 開発者は選択された店舗で絞り込み（'all'なら全件）
    if (selectedShopId !== 'all') {
      query = query.eq('home_shop_id', selectedShopId)
    }
  } else if (currentUser.role === 'admin') {
    // 店長は自分の店舗固定
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
      home_shop_id: currentUser.home_shop_id // ここを shop_id から変更
    }
  };
}