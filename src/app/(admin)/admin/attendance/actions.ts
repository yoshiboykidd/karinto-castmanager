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

  // 1. ユーザー確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error("❌ Auth: ユーザーがログインしていません");
    return { shifts: [], myProfile: null };
  }

  const loginId = user.email?.split('@')[0] || ''
  const { data: currentUser } = await supabase
    .from('cast_members')
    .select('role, home_shop_id')
    .eq('login_id', loginId)
    .single()

  if (!currentUser) {
    console.error("❌ DB: キャストプロファイルが見つかりません:", loginId);
    return { shifts: [], myProfile: null };
  }

  // 2. フィルタリング条件の作成
  let query = supabase.from('shifts').select('*').eq('shift_date', selectedDate);
  
  const rawFilterId = currentUser.role === 'developer' ? selectedShopId : currentUser.home_shop_id;

  if (rawFilterId !== 'all' && rawFilterId) {
    // 📍 修正: 本番環境でも確実に3桁(006等)で前方一致検索を行う
    const formattedId = String(rawFilterId).padStart(3, '0');
    query = query.like('login_id', `${formattedId}%`);
  }

  // 3. データ取得実行
  const { data: shifts, error } = await query.order('start_time', { ascending: true });
  
  if (error) {
    console.error('❌ DB Query Error:', error.message);
    return { shifts: [], myProfile: currentUser };
  }

  return { shifts: shifts || [], myProfile: currentUser };
}