'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import DailyStats from './DailyDetail/DailyStats';
import ReservationModal from './DailyDetail/ReservationModal';
import ReservationList from './DailyDetail/ReservationList';

export default function DailyDetail({ date, dayNum, shift, allShifts = [], reservations = [], theme = 'pink', supabase, onRefresh, myLoginId }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [allPastReservations, setAllPastReservations] = useState<any[]>([]);

  const dayTotals = useMemo(() => {
    return reservations.reduce((acc: any, res: any) => {
      const isSoe = res.service_type === '添';
      const cat = res.nomination_category;
      const target = isSoe ? acc.soe : acc.ka;
      if (cat === 'FREE') target.free++;
      else if (cat === '初指') target.first++;
      else if (cat === '本指') target.main++;
      return acc;
    }, {
      ka: { free: 0, first: 0, main: 0 },
      soe: { free: 0, first: 0, main: 0 }
    });
  }, [reservations]);

  const isAbsent = shift?.status === 'absent';
  const isLate = shift?.is_late === true;
  // 📍 シフト（仕事）があるかどうかの判定
  const hasShift = shift?.status === 'official' || isAbsent;

  // 📍 予約がない時のメッセージを生成
  const noMissionMessage = useMemo(() => {
    if (isAbsent) return '当欠処理済み';
    return hasShift 
      ? '本日もよろしくお願いします' 
      : 'お休みです。ゆっくり過ごされてください';
  }, [isAbsent, hasShift]);

  useEffect(() => {
    const fetchMyHistory = async () => {
      if (!myLoginId || !supabase) return;
      const { data, error } = await supabase.from('reservations').select('*').eq('login_id', myLoginId);
      if (!error && data) setAllPastReservations(data);
    };
    fetchMyHistory();
  }, [myLoginId, supabase, date]);

  useEffect(() => {
    const autoDelete = async () => {
      if (isAbsent && reservations.length > 0 && supabase && myLoginId) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const { error } = await supabase.from('reservations').delete()
          .eq('login_id', myLoginId).eq('reservation_date', dateStr);
        if (!error && onRefresh) onRefresh();
      }
    };
    autoDelete();
  }, [isAbsent, reservations.length, date, myLoginId, supabase, onRefresh]);

  useEffect(() => {
    if (!selectedRes) {
      setMemoDraft('');
      setIsEditingMemo(false);
      return;
    }
    setMemoDraft(selectedRes.cast_memo || '');
  }, [selectedRes?.id]);

  const handleDelete = async () => {
    if (!selectedRes?.id || !supabase) return;
    if (!window.confirm("この予約を完全に削除しますか？")) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('reservations').delete().eq('id', selectedRes.id);
      if (!error) {
        setSelectedRes(null);
        if (onRefresh) onRefresh();
      }
    } finally { setIsDeleting(false); }
  };

  const handleSaveMemo = async () => {
    if (!selectedRes?.id || !supabase) return;
    const cNo = selectedRes.customer_no;
    try {
      let query = supabase.from('reservations').update({ cast_memo: memoDraft });
      if (cNo) {
        query = query.eq('customer_no', cNo).eq('login_id', myLoginId);
      } else {
        query = query.eq('id', selectedRes.id);
      }
      const { error } = await query;
      if (error) throw error;
      setSelectedRes({ ...selectedRes, cast_memo: memoDraft });
      if (onRefresh) onRefresh();
    } catch (err) { 
      console.error(err);
      alert("保存に失敗しました。"); 
    }
  };

  const getBadgeStyle = (label: string) => {
    switch (label) {
      case 'か': return 'bg-blue-500 text-white';
      case '添': return 'bg-pink-500 text-white';
      case 'FREE': return 'bg-cyan-400 text-white';
      case '初指': return 'bg-green-500 text-white';
      case '本指': return 'bg-purple-500 text-white';
      default: return 'bg-gray-100 text-gray-400';
    }
  };

  const eventInfo = useMemo(() => {
    const d = date.getDate();
    if (d === 10) return { label: 'かりんとの日', color: 'bg-[#FF9900]', text: 'text-white' };
    if (d === 11 || d === 22) return { label: '添い寝の日', color: 'bg-[#FFD700]', text: 'text-[#5C4033]' };
    const dateStr = format(date, 'yyyy-MM-dd');
    const dbFound = allShifts.find((s: any) => s.shift_date === dateStr && s.event_name);
    return dbFound ? { label: dbFound.event_name, color: 'bg-pink-500', text: 'text-white' } : null;
  }, [date, allShifts]);

  const themeColors: any = { pink: 'text-pink-500', blue: 'text-cyan-600', yellow: 'text-yellow-600' };
  const accentColor = themeColors[theme] || themeColors.pink;

  if (!date) return null;

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl flex flex-col">
        {eventInfo && (
          <div className={`w-full py-1 ${eventInfo.color} ${eventInfo.text} text-center text-[12px] font-black tracking-widest uppercase`}>
            {eventInfo.label}
          </div>
        )}
        
        <div className="flex items-center justify-center w-full p-2 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex items-baseline font-black tracking-tighter text-gray-800 leading-none">
              <span className="text-[24px]">{format(date, 'M')}</span>
              <span className="text-[12px] mx-0.5 opacity-20">/</span>
              <span className="text-[24px]">{format(date, 'd')}</span>
              <span className="text-[10px] ml-0.5 opacity-30">({format(date, 'E', { locale: ja })})</span>
            </div>
            {hasShift ? (
              <div className="flex items-center gap-1">
                {isAbsent ? (
                  <span className="w-10 h-6 flex items-center justify-center rounded bg-rose-600 text-white text-[10px] font-black">当欠</span>
                ) : isLate ? (
                  <span className="w-10 h-6 flex items-center justify-center rounded bg-amber-500 text-white text-[10px] font-black animate-pulse">遅刻</span>
                ) : (
                  <span className="w-10 h-6 flex items-center justify-center rounded bg-pink-500 text-white text-[10px] font-black">確定</span>
                )}
                <div className={`flex items-baseline font-black tracking-tighter leading-none ${isAbsent ? 'text-gray-300 line-through' : accentColor}`}>
                  <span className="text-[20px]">{shift?.start_time}</span>
                  <span className="text-[10px] mx-0.5 opacity-20">〜</span>
                  <span className="text-[20px]">{shift?.end_time}</span>
                </div>
              </div>
            ) : (
              <span className="text-[11px] font-black text-gray-200 uppercase tracking-widest ml-1">Day Off</span>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[100px]">
          <ReservationList 
            reservations={reservations} 
            onSelect={setSelectedRes} 
            getBadgeStyle={getBadgeStyle} 
            isAbsent={isAbsent}
            noMissionMessage={noMissionMessage} // 📍 動的メッセージを渡す
          />
        </div>

        {/* 📍 3. 統計情報：予約が1件以上ある場合のみ表示 */}
        {reservations.length > 0 && (
          <DailyStats 
            dayTotals={dayTotals} 
            rewardAmount={shift?.reward_amount} 
            theme={theme} 
          />
        )}
      </section>

      <ReservationModal 
        selectedRes={selectedRes}
        onClose={() => setSelectedRes(null)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        isEditingMemo={isEditingMemo}
        setIsEditingMemo={setIsEditingMemo}
        memoDraft={memoDraft}
        setMemoDraft={setMemoDraft}
        onSaveMemo={handleSaveMemo}
        getBadgeStyle={getBadgeStyle}
        allPastReservations={allPastReservations}
      />
    </>
  );
}