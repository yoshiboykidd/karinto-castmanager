'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// ★波線対策：日付操作の道具をインポート
import { isSameDay, parseISO } from 'date-fns';
import { useShiftData } from '@/hooks/useShiftData';

// コンポーネントのインポート（既存のフォルダ構成に準拠）
import CastHeader from './dashboard/CastHeader';
import CalendarSection from './dashboard/CalendarSection';
import DailyDetail from './dashboard/DailyDetail';
import FixedFooter from './dashboard/FixedFooter';

export default function DashboardContent() {
  const router = useRouter();
  
  // 既存のカスタムフックからSupabaseとデータを取得
  const { data, loading, supabase, fetchInitialData } = useShiftData();
  
  // 状態管理
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 初回データ読み込み
  useEffect(() => {
    fetchInitialData(router);
  }, [fetchInitialData, router]);

  // ★「ゆうか」さんの予約をリアルタイムで監視するロジック
  useEffect(() => {
    if (!data?.profile?.login_id || !supabase) return;

    // 1. 既存の予約をDBから取得
    const fetchReservations = async () => {
      const { data: resData, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('cast_login_id', data.profile.login_id);
      
      if (!error && resData) {
        setReservations(resData);
      }
    };

    fetchReservations();

    // 2. Realtime監視（Workerが書き込んだ瞬間に画面を更新）
    const channel = supabase
      .channel('dashboard_res_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'reservations',
        filter: `cast_login_id=eq.${data.profile.login_id}` 
      }, (payload) => {
        setReservations(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.profile?.login_id, supabase]);

  // ローディング画面
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
        <div className="font-black text-pink-200 animate-pulse text-4xl italic tracking-tighter">
          KARINTO...
        </div>
      </div>
    );
  }

  // 選択された日付に届いている予約だけを抽出
  const dailyReservations = reservations.filter(res => {
    try {
      const resDate = typeof res.reservation_time === 'string' 
        ? parseISO(res.reservation_time) 
        : new Date(res.reservation_time);
      return isSameDay(resDate, selectedDate);
    } catch (e) {
      return false;
    }
  });

  // ヘッダー情報の整理
  const headerShopName = data?.shop?.shop_name || "マイページ";
  const headerDisplayName = data?.profile?.display_name || "キャスト";
  const headerSyncTime = data?.syncAt;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-32">
      <CastHeader 
        shopName={headerShopName}
        displayName={headerDisplayName}
        syncTime={headerSyncTime}
      />

      <main className="px-4 space-y-4 mt-4">
        {/* カレンダーセクション */}
        <CalendarSection 
          shifts={data?.shifts || []} 
          onDateSelect={(date) => setSelectedDate(date)}
        />

        {/* 詳細カード（ここに予約が流れます） */}
        <DailyDetail 
          date={selectedDate}
          dayNum={selectedDate.getDate()}
          // シフトデータから該当日の出勤時間を探す
          shift={data?.shifts?.find((s: any) => {
            try {
              return isSameDay(parseISO(s.date), selectedDate);
            } catch {
              return false;
            }
          })}
          reservations={dailyReservations}
        />
      </main>

      <FixedFooter />
    </div>
  );
}