'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 権限と店舗に基づいたシフト一覧の取得
 */
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

  // 1. 操作ユーザーの権限取得
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { shifts: [], myProfile: null }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) return { shifts: [], myProfile: null }

  // 2. シフトデータのクエリ構築
  // cast_members!inner を使うことで、リレーション先の店舗IDでの絞り込みを有効にします
  let query = supabase
    .from('shifts')
    .select(`
      *,
      cast_members!inner (
        login_id,
        display_name,
        home_shop_id
      )
    `)
    .eq('shift_date', selectedDate)

  if (currentUser.role === 'developer') {
    if (selectedShopId !== 'all') {
      // 開発者の場合は選択した店舗IDで絞り込み
      query = query.eq('cast_members.home_shop_id', selectedShopId)
    }
  } else {
    // 店長（admin）は自分の店舗IDで固定
    query = query.eq('cast_members.home_shop_id', currentUser.home_shop_id)
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })

  if (error) {
    console.error('Fetch error:', error)
    return { shifts: [], myProfile: null }
  }

  return {
    shifts: shifts || [],
    myProfile: {
      role: currentUser.role,
      home_shop_id: currentUser.home_shop_id
    }
  }
}

/**
 * 当欠ステータスの切り替え
 */
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
  const { error } = await supabase
    .from('shifts')
    .update({ status: newStatus })
    .eq('id', shiftId)

  return { success: !error, newStatus }
}