'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 📍 export を確実に付ける
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

  // デバッグ：条件なしで20件取る
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('*')
    .limit(20)

  if (error) console.error('Error:', error)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', user?.email?.split('@')[0] || '')
    .single()

  return {
    shifts: shifts || [],
    myProfile: currentUser || null
  }
}

// 📍 export を確実に付ける
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