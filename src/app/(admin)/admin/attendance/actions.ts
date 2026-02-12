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

  // 📍 修正：リレーション（cast_members）を一旦完全に外す
  // これにより、結合エラーで0件になる現象を100%回避します
  let query = supabase
    .from('shifts')
    .select('*') 
    .eq('shift_date', selectedDate)

  const filterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id;

  if (filterId !== 'all' && filterId) {
    // 📍 修正：store_code または login_id の前方一致のみで判定
    query = query.or(`store_code.eq.${filterId}, login_id.ilike.${filterId}%`)
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })

  if (error) console.error('Fetch error:', error)

  return {
    shifts: shifts || [],
    myProfile: currentUser
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