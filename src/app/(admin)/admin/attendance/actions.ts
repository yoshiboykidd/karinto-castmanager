'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 権限に基づいたシフト一覧の取得
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

  if (currentUser.role === 'developer') {
    if (selectedShopId !== 'all') {
      query = query.eq('cast_members.home_shop_id', selectedShopId)
    }
  } else {
    // 店長（admin）は自店のみ
    query = query.eq('cast_members.home_shop_id', currentUser.home_shop_id)
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })

  if (error) console.error(error)

  return {
    shifts: shifts || [],
    myProfile: {
      role: currentUser.role,
      home_shop_id: currentUser.home_shop_id
    }
  }
}

/**
 * 出勤ステータスの更新（当欠・復旧）
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