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

  // 1. シフトとキャスト情報を結合して取得
  // store_code が null の場合に備え、リレーション先の home_shop_id も取得対象にします
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

  // 2. 店舗フィルタリングの適用
  // 店長（admin）の場合は、選択肢に関わらず「自分の home_shop_id」で強制フィルター
  const filterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id;

  if (filterId !== 'all') {
    // 📍 修正のキモ：
    // シフト側の store_code もしくは キャスト側の home_shop_id のいずれかが一致するものを抽出
    // これにより、store_code が null のデータも home_shop_id が合っていれば表示されます
    query = query.or(`store_code.eq.${filterId}, cast_members.home_shop_id.eq.${filterId}`)
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