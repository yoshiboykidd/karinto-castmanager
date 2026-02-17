'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * シフト一覧を取得する
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { shifts: [], myProfile: null }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) return { shifts: [], myProfile: null }

  let query = supabase.from('shifts').select('*').eq('shift_date', selectedDate)
  
  const rawFilterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id

  if (rawFilterId !== 'all' && rawFilterId) {
    const formattedId = String(rawFilterId).padStart(3, '0');
    query = query.like('login_id', `${formattedId}%`)
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })
  
  if (error) {
    console.error('DB Error:', error.message)
    return { shifts: [], myProfile: currentUser }
  }

  return { shifts: shifts || [], myProfile: currentUser }
}

/**
 * 📍 Vercelが「見つからない」と言っているのはこの関数です
 */
export async function updateShiftAction(shiftId: string, type: 'absent' | 'late', current: any) {
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

  if (type === 'absent') {
    const newStatus = current === 'absent' ? 'official' : 'absent'
    const { error } = await supabase
      .from('shifts')
      .update({ status: newStatus })
      .eq('id', shiftId)
    
    return { success: !error, newValue: newStatus }
  } else {
    const newLate = !current
    const { error } = await supabase
      .from('shifts')
      .update({ is_late: newLate })
      .eq('id', shiftId)
    
    return { success: !error, newValue: newLate }
  }
}