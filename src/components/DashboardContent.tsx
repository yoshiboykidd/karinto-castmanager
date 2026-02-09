'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isSameDay, parseISO } from 'date-fns';
import { useShiftData } from '@/hooks/useShiftData';

// ★ディレクトリ構成に基づいた正確なインポート
import CastHeader from './dashboard/CastHeader';
import DashboardCalendar from './DashboardCalendar';
import DailyDetail from './dashboard/DailyDetail';
import FixedFooter from './dashboard/FixedFooter';

export default function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  
  const { data, loading, supabase, fetchInitialData } = useShiftData();
  
  // 状態管理
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetchInitialData(router);
  }, [fetchInitialData, router]);

  // ★「ゆうか」さんの予約を監視するリアルタイムロジック
  useEffect(() => {
    if (!data?.profile?.login_id || !supabase) return;

    const fetchReservations = async () => {
      // Workerで保存した「login_id」列で取得
      const { data: resData, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('login_id', data.profile.login_id);
      
      if (!error && resData) {
        setReservations(resData);
      }
    };

    fetchReservations();

    // リアルタイム通知の登録 (login_idでフィルタ)
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

  // 選択された日付の予約を抽出 (reservation_date列を参照)
  const dailyReservations = reservations.filter(res => {
    try {
      const resTime = res.reservation_date; 
      if (!resTime) return false;
      const resDate = typeof resTime === 'string' ? parseISO(resTime) : new Date(resTime);
      return isSameDay(resDate, selectedDate);
    } catch {
      return false;
    }
  });

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-32">
      <CastHeader 
        shopName={data?.shop?.shop_name || "池西"}
        displayName={data?.profile?.display_name || "キャスト"}
        syncTime={data?.syncAt}
      />

      <main className="px-4 space-y-4 mt-4">
        {/* ★DashboardCalendarのProps定義に完全一致 */}
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
          // シフトも shift_date 列で検索するように修正
          shift={data?.shifts?.find((s: any) => {
            try {
              return s.shift_date && isSameDay(parseISO(s.shift_date), selectedDate);
            } catch {
              return false;
            }
          })}
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