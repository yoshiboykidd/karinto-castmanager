'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Reservation {
  id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  course_info: string;
  nomination_type: string;
  memo?: string;
  raw_body?: string;
}

export default function DailyDetail({ date, dayNum, shift, reservations, theme }: any) {
  const [openId, setOpenId] = useState<string | null>(null);

  // その日の予約を抽出し、時間順にソート
  const todayReservations = useMemo(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (reservations || [])
      .filter((r: Reservation) => r.reservation_date === dateStr)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
  }, [reservations, date]);

  const accentColor = theme === 'pink' ? 'text-pink-400' : 
                      theme === 'blue' ? 'text-cyan-500' : 
                      theme === 'yellow' ? 'text-yellow-500' : 'text-gray-500';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 📍 シフト概要：フォントサイズとウェイトを極限まで強調 */}
      <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[35px] p-6 shadow-xl shadow-pink-100/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-[22px] bg-white shadow-inner flex flex-col items-center justify-center font-black ${accentColor}`}>
              <span className="text-[10px] uppercase opacity-50 tracking-tighter leading-none font-black">Day</span>
              <span className="text-2xl -mt-0.5 italic">{dayNum}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5 italic">Schedule Details</p>
              <h3 className="text-xl font-black text-gray-800 tracking-tighter italic">
                {shift?.start_time || '--:--'} <span className="text-gray-200 mx-0.5">/</span> {shift?.end_time || '--:--'}
              </h3>
            </div>
          </div>
          {shift?.status === 'official' && (
            <div className="bg-green-500/10 text-green-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase italic tracking-widest border border-green-200/50 shadow-sm">
              Confirmed
            </div>
          )}
        </div>
      </section>

      {/* 📍 予約概要：以前の「15:00～ サカモト様」形式 ＋ デザイン完全復旧 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] italic">Current Reservations</h4>
          <span className="text-[10px] font-black text-gray-300 italic">{todayReservations.length} items</span>
        </div>
        
        {todayReservations.length > 0 ? (
          todayReservations.map((res: Reservation) => {
            // 記号ロジック
            const typeLabel = res.course_info?.includes('添い寝') ? '<添>' : '<か>';
            let sourceLabel = '<初>';
            if (res.nomination_type?.includes('本指名')) sourceLabel = '<本>';
            else if (res.nomination_type?.includes('フリー')) sourceLabel = '<F>';

            const duration = res.course_info?.match(/\d+/)?.[0] || '--';

            return (
              <div key={res.id} className="group">
                <button
                  onClick={() => setOpenId(openId === res.id ? null : res.id)}
                  className={`w-full bg-white border border-gray-100 rounded-[24px] p-5 flex items-center justify-between shadow-sm active:scale-[0.97] transition-all ${openId === res.id ? 'ring-2 ring-gray-200 shadow-md' : ''}`}
                >
                  <div className="flex items-center gap-2 text-[14px] font-black text-gray-800 tracking-tighter overflow-hidden">
                    <span className={`${accentColor} text-lg`}>⏰</span>
                    <span className="text-blue-500 whitespace-nowrap">{typeLabel}</span>
                    <span className="italic whitespace-nowrap text-[15px]">{res.start_time.slice(0,5)}～{res.end_time.slice(0,5)}</span>
                    <span className="text-rose-400 font-black ml-1 whitespace-nowrap">{sourceLabel}</span>
                    <span className="truncate">{res.customer_name}様</span>
                    <span className="text-gray-400 text-xs font-black whitespace-nowrap">{duration}min</span>
                  </div>
                  {openId === res.id ? <ChevronUp size={20} className="text-gray-300" /> : <ChevronDown size={20} className="text-gray-300" />}
                </button>

                {/* 詳細アコーディオン */}
                {openId === res.id && (
                  <div className="bg-gray-50/80 rounded-b-[28px] mx-5 p-6 pt-5 border-x border-b border-gray-100/50 space-y-4 animate-in slide-in-from-top-3 duration-500 shadow-inner">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Reservation Notes</p>
                      <div className="text-[13px] font-black text-gray-600 leading-relaxed bg-white/80 p-4 rounded-[20px] border border-white shadow-sm">
                        {res.memo || res.raw_body || "詳細情報はありません。"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-gray-50/30 rounded-[35px] border border-dashed border-gray-200">
            <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] italic">No appointments</p>
          </div>
        )}
      </div>
    </div>
  );
}