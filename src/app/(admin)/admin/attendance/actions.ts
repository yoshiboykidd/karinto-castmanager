'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 勤怠データ取得：!innerを排除し、OR条件で漏れなく取得
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

  // 1. ユーザープロフィールの取得
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { shifts: [], myProfile: null }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) return { shifts: [], myProfile: null }

  // 2. クエリ構築
  // 📍 !inner を削除。キャスト情報がなくても shifts 自体は必ず取るように変更
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

  // 3. 店舗フィルタリングの適用
  const filterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id;

  if (filterId !== 'all' && filterId) {
    // 📍 漏れを防ぐ3段構えのOR条件
    // ① store_code が一致
    // ② login_id の先頭3文字が一致（API修正前のデータ救済）
    // ③ キャストテーブル側の所属店舗が一致
    query = query.or(`store_code.eq.${filterId}, login_id.ilike.${filterId}%, cast_members.home_shop_id.eq.${filterId}`)
  }

  const { data: shifts, error } = await query.order('start_time', { ascending: true })

  if (error) console.error('Fetch error:', error)

  return {
    shifts: shifts || [],
    myProfile: currentUser
  }
}

/**
 * ステータス更新
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