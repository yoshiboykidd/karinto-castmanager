'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, parseISO, startOfToday, isAfter } from 'date-fns';

import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import RequestList from '@/components/dashboard/RequestList';
import NewsSection from '@/components/dashboard/NewsSection';
import FixedFooter from '@/components/dashboard/FixedFooter';

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [data, setData] = useState<{shifts: any[], profile: any, shop: any, news: any[], syncAt: string}>({
    shifts: [], profile: null, shop: null, news: [], syncAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selected, setSelected] = useState<{single?: Date, multi: Date[]}>({ single: new Date(), multi: [] });
  const [editReward, setEditReward] = useState({ f: '', first: '', main: '', amount: '' });
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});

  useEffect(() => { fetchInitialData(); }, []);

  async function fetchInitialData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    const loginId = session.user.email?.replace('@karinto-internal.com', '');
    const { data: profile } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
    if (profile) {
      const myShopId = profile.home_shop_id || 'main';
      const [shop, shifts, news, sync] = await Promise.all([
        supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
        supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
        supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
        supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
      ]);
      setData({ shifts: shifts.data || [], profile, shop: shop.data, news: news.data || [], syncAt: sync.data ? format(parseISO(sync.data.last_sync_at), 'HH:mm') : '' });
    }
    setLoading(false);
  }

  // 月間合計：HPから取得した確定シフト（または公式枠のある申請中）のみを集計
  const monthlyTotals = useMemo(() => {
    const today = startOfToday();
    return (data.shifts || [])
      .filter((s: any) => {
        const d = parseISO(s.shift_date);
        const isPastOrToday = !isAfter(d, today);
        // HPから持ってきた情報（is_official_pre_exist）があることが前提
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        const hasTime = s.start_time && s.start_time !== 'OFF';
        
        return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear() && isPastOrToday && isOfficialInfo && hasTime;
      })
      .reduce((acc, s: any) => ({ 
        amount: acc.amount + (Number(s.reward_amount) || 0), 
        f: acc.f + (Number(s.f_count) || 0), 
        first: acc.first + (Number(s.first_request_count) || 0), 
        main: acc.main + (Number(s.main_request_count) || 0), 
        count: acc.count + 1, 
        hours: acc.hours + 8 
      }), { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [data.shifts, viewDate]);

  useEffect(() => {
    if (isRequestMode || !selected.single) return;
    const dateStr = format(selected.single!, 'yyyy-MM-dd');
    const shift = data.shifts.find(s => s.shift_date === dateStr);
    setEditReward({ 
      f: String(shift?.f_count || ''), 
      first: String(shift?.first_request_count || ''), 
      main: String(shift?.main_request_count || ''), 
      amount: String(shift?.reward_amount || '') 
    });
  }, [selected.single, data.shifts, isRequestMode]);

  const handleSaveAchievement = async () => {
    if (!selected.single || !data.profile) return;
    const dateStr = format(selected.single, 'yyyy-MM-dd');
    const selectedShift = data.shifts.find(s => s.shift_date === dateStr);

    // HPに情報がない（休み）場合は保存させない
    if (!selectedShift || selectedShift.start_time === 'OFF') {
      alert('シフトがない日は実績を入力できません');
      return;
    }

    const { error } = await supabase.from('shifts').update({ 
      f_count: Number(editReward.f) || 0, 
      first_request_count: Number(editReward.first) || 0, 
      main_request_count: Number(editReward.main) || 0, 
      reward_amount: Number(editReward.amount) || 0,
      is_official: true 
    }).eq('login_id', data.profile.login_id).eq('shift_date', dateStr);
    
    if (!error) { fetchInitialData(); alert('実績を保存しました💰'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse text-5xl italic">KARINTO...</div>;

  const today = startOfToday();
  const selectedShift = selected.single ? data.shifts.find(s => s.shift_date === format(selected.single!, 'yyyy-MM-dd')) : null;
  
  // 保存・編集ができるかの判定
  const isEditable = selected.single && 
                     !isAfter(selected.single, today) && 
                     selectedShift && 
                     selectedShift.start_time && 
                     selectedShift.start_time !== 'OFF';

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden">
      <CastHeader shopName={data.shop?.shop_name} syncTime={data.syncAt} displayName={data.profile?.display_name} version="v2.9.9.30" />
      
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setSelected({ single: new Date(), multi: [] }); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSelected({ single: undefined, multi: [] }); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {!isRequestMode && <MonthlySummary month={format(viewDate, 'M月')} totals={monthlyTotals} />}
        
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar 
            shifts={data.shifts} 
            selectedDates={isRequestMode ? selected.multi : selected.single} 
            onSelect={(d: any) => isRequestMode ? setSelected(p => ({...p, multi: d})) : setSelected({single: d, multi: []})} 
            month={viewDate} 
            onMonthChange={setViewDate} 
            isRequestMode={isRequestMode} 
          />
        </section>

        {!isRequestMode && selected.single && (
          <DailyDetail 
            date={selected.single} 
            dayNum={selected.single.getDate()} 
            shift={selectedShift} 
            editReward={editReward} 
            setEditReward={setEditReward} 
            onSave={handleSaveAchievement} 
            isEditable={!!isEditable} 
          />
        )}
        <NewsSection newsList={data.news} />
      </main>

      <FixedFooter pathname={pathname} onHome={() => router.push('/')} onSalary={() => router.push('/salary')} onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} />
    </div>
  );
}