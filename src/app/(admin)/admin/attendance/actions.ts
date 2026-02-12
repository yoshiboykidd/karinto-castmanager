'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getFilteredAttendance(selectedDate: string, selectedShopId: string = 'all') {
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
  if (!user) return { shifts: [], myProfile: null }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) return { shifts: [], myProfile: null }

  // 📍 クエリの構築
  // 一旦 !inner を外して、確実にデータが取れるかテストします
  let query = supabase
    .from('shifts')
    .select(`
      *,
      cast_members (
        login_id,
        display_name,
        home_shop_id
      )
    `)
    .eq('shift_date', selectedDate)

  // 📍 フィルター条件の適用
  if (currentUser.role === 'developer') {
    if (selectedShopId !== 'all') {
      // 開発者の場合：home_shop_id が一致するものを探す
      query = query.filter('cast_members.home_shop_id', 'eq', selectedShopId)
    }
  } else {
    // 店長の場合：自店舗のみ
    query = query.filter('cast_members.home_shop_id', 'eq', currentUser.home_shop_id)
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })

  if (error) {
    console.error('Fetch Error:', error)
  }

  // 📍 デバッグ用：取得した生データをログに出す（Vercelのログで確認可能）
  console.log(`Date: ${selectedDate}, Shop: ${selectedShopId}, Count: ${shifts?.length || 0}`)

  return {
    shifts: shifts || [],
    myProfile: {
      role: currentUser.role,
      home_shop_id: currentUser.home_shop_id
    }
  }
}

export async function updateShiftStatus(shiftId: string, currentStatus: string) {
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
  const newStatus = currentStatus === 'absent' ? 'official' : 'absent'
  const { error } = await supabase.from('shifts').update({ status: newStatus }).eq('id', shiftId)
  return { success: !error, newStatus }
}