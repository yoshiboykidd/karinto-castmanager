// src/app/(admin)/admin/attendance/actions.ts

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

  // 📍 デバッグ用：店舗フィルタリングを完全に無視し、日付だけで取得
  // これで出れば、店舗IDの指定方法（home_shop_idなど）が原因だと確定します。
  const { data: shifts, error } = await supabase
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
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Fetch Error:', error);
  }

  // ユーザープロフィールの取得（ボタン表示などのため）
  const { data: { user } } = await supabase.auth.getUser()
  const loginId = user?.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

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