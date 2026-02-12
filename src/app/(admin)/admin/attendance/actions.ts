'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getFilteredAttendance(selectedDate: string, selectedShopId: string = 'all') {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get(name: string) { return cookieStore.get(name)?.value } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  const loginId = user?.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase.from('cast_members').select('role, home_shop_id').eq('login_id', loginId).single()
  if (!currentUser) return { shifts: [], myProfile: null }

  // 📍 結合を解除して shifts テーブル単体から取得（データ漏れ防止）
  let query = supabase.from('shifts').select('*').eq('shift_date', selectedDate)
  
  const filterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id
  if (filterId !== 'all' && filterId) {
    query = query.or(`store_code.eq.${filterId}, login_id.ilike.${filterId}%`)
  }

  const { data: shifts } = await query.order('start_time', { ascending: true })
  return { shifts: shifts || [], myProfile: currentUser }
}

export async function updateShiftAction(shiftId: string, type: 'absent' | 'late', current: any) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get(name: string) { return cookieStore.get(name)?.value } }
  })

  if (type === 'absent') {
    const newStatus = current === 'absent' ? 'official' : 'absent'
    const { error } = await supabase.from('shifts').update({ status: newStatus }).eq('id', shiftId)
    return { success: !error, newValue: newStatus }
  } else {
    const newLate = !current
    const { error } = await supabase.from('shifts').update({ is_late: newLate }).eq('id', shiftId)
    return { success: !error, newValue: newLate }
  }
}