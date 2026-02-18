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

  // 📍 修正1: 日付の完全一致を狙いつつ、もし取れなかったらログを出す
  let query = supabase.from('shifts').select('*').eq('shift_date', selectedDate)
  
  const rawFilterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id

  if (rawFilterId !== 'all' && rawFilterId) {
    // 📍 修正2: 3桁(006)と数値(6)の両方に対応できるよう、先頭が一致すればOKとする
    const formattedId = String(rawFilterId).padStart(3, '0');
    const shortId = String(parseInt(rawFilterId, 10)); // "006" -> "6"
    
    // login_id が "006..." または "6..." で始まるものを探す (OR検索)
    query = query.or(`login_id.like.${formattedId}%,login_id.like.${shortId}%`);
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })
  
  if (error) {
    console.error('❌ Query Error:', error.message)
    return { shifts: [], myProfile: currentUser }
  }

  // 📍 デバッグ用: サーバーログに現在の検索条件を表示
  console.log(`[ATTENDANCE] Date: ${selectedDate}, Shop: ${rawFilterId}, Found: ${shifts?.length || 0}件`);

  return { shifts: shifts || [], myProfile: currentUser }
}

// updateShiftAction は変更なし
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