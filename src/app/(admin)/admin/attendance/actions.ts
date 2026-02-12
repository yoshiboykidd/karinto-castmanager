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
  const loginId = user?.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  // 📍 フィルタリングの構築
  let query = supabase.from('shifts').select('*').eq('shift_date', selectedDate)

  if (currentUser?.role === 'developer') {
    if (selectedShopId !== 'all') {
      query = query.eq('store_code', selectedShopId)
    }
  } else {
    query = query.eq('store_code', currentUser?.home_shop_id)
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })

  if (error) console.error('Fetch error:', error)

  return {
    shifts: shifts || [],
    myProfile: currentUser || null
  }
}

export async function updateShiftStatus(shiftId: string, currentStatus: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { get(name: string) { return cookieStore.get(name)?.value }, },
  })
  const newStatus = currentStatus === 'absent' ? 'official' : 'absent'
  const { error } = await supabase.from('shifts').update({ status: newStatus }).eq('id', shiftId)
  return { success: !error, newStatus }
}