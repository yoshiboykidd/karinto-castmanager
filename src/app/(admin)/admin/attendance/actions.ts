'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * 📍 指定された日付と店舗のシフト一覧を取得する
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

  // 1. ユーザープロファイルの確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { shifts: [], myProfile: null }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) return { shifts: [], myProfile: null }

  // 2. 日付による絞り込み
  // shift_date は "2026-02-12" のようなハイフン区切りの形式に対応
  let query = supabase.from('shifts').select('*').eq('shift_date', selectedDate)
  
  // 3. 権限に応じた店舗フィルタリング
  const rawFilterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id

  if (rawFilterId !== 'all' && rawFilterId) {
    // DB内の store_code に合わせて 3桁(006等)に補正
    const formattedId = String(rawFilterId).padStart(3, '0');
    // login_id ではなく、確実に存在する store_code カラムを使用
    query = query.eq('store_code', formattedId); 
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })
  
  if (error) {
    console.error('Attendance fetch error:', error.message)
    return { shifts: [], myProfile: currentUser }
  }

  return { shifts: shifts || [], myProfile: currentUser }
}

/**
 * 📍 遅刻・当欠ステータスを更新する (ビルドエラー防止のため必須)
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
    // 当欠 (absent) ↔ 通常 (official) の切り替え
    const newStatus = current === 'absent' ? 'official' : 'absent'
    const { error } = await supabase
      .from('shifts')
      .update({ status: newStatus })
      .eq('id', shiftId)
    
    if (!error) revalidatePath('/admin/attendance')
    return { success: !error, newValue: newStatus }
  } else {
    // 遅刻フラグの反転
    const newLate = !current
    const { error } = await supabase
      .from('shifts')
      .update({ is_late: newLate })
      .eq('id', shiftId)
    
    if (!error) revalidatePath('/admin/attendance')
    return { success: !error, newValue: newLate }
  }
}