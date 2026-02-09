'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isSameDay, parseISO } from 'date-fns';
import { useShiftData } from '@/hooks/useShiftData';

import CastHeader from './dashboard/CastHeader';
import DashboardCalendar from './DashboardCalendar';
import DailyDetail from './dashboard/DailyDetail';
import FixedFooter from './dashboard/FixedFooter';

export default function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  
  const { data, loading, supabase, fetchInitialData } = useShiftData();
  
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetchInitialData(router);
  }, [fetchInitialData, router]);

  useEffect(() => {
    // data.profile.login_id (例: yuuka) が取得できるまで待機
    if (!data?.profile?.login_id || !supabase) return;

    const fetchReservations = async () => {
      // Workerで保存した「login_id」列を使って取得
      const { data: resData, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('login_id', data.profile.login_id);
      
      if (!error && resData) {
        setReservations(resData);
      }
    };

    fetchReservations();

    const channel = supabase
      .channel('dashboard_res_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'reservations',
        filter: `login_id=eq.${data.profile.login_id}` 
      }, (payload) => {
        setReservations(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.profile?.login_id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
        <div className="font-black text-pink-200 animate-pulse text-4xl italic tracking-tighter">
          KARINTO...
        </div>
      </div>
    );
  }

  // 抽出条件を Worker で保存した reservation_date に合わせる
  const dailyReservations = reservations.filter(res => {
    try {
      const resDateStr = res.reservation_date; // "2026-02-10"
      if (!resDateStr) return false;
      return isSameDay(parseISO(resDateStr), selectedDate);
    } catch {
      return false;
    }
  });

  return (
    // ★カラー設定を復旧: 背景色 bg-[#FFFDFE] などを再定義
    <div className="min-h-screen bg-[#FFFDFE] pb-32">
      <CastHeader 
        shopName={data?.shop?.shop_name || "池西"}
        displayName={data?.profile?.display_name || "キャスト"}
        syncTime={data?.syncAt}
      />

      <main className="px-4 space-y-4 mt-4">
        <DashboardCalendar 
          shifts={data?.shifts || []} 
          selectedDates={selectedDate}
          onSelect={(date: Date) => setSelectedDate(date)}
          month={currentMonth}
          onMonthChange={(date: Date) => setCurrentMonth(date)}
          isRequestMode={false}
        />

        <DailyDetail 
          date={selectedDate}
          dayNum={selectedDate.getDate()}
          shift={data?.shifts?.find((s: any) => {
            try {
              // DBのカラム名 shift_date に合わせて比較
              return s.shift_date && isSameDay(parseISO(s.shift_date), selectedDate);
            } catch {
              return false;
            }
          })}
          // ★ここで Worker が保存した最新の予約リストを渡す
          reservations={dailyReservations}
        />
      </main>

      <FixedFooter 
        pathname={pathname || ''} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onProfile={() => router.push('/mypage')} 
        onLogout={async () => {
          if (supabase) await supabase.auth.signOut();
          router.push('/login');
        }} 
      />
    </div>
  );
}