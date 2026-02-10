'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

// 📍 Workerから届くDBの型に合わせてインターフェースを調整
interface Reservation {
  id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  course_info: string;    // DBのカラム名に合わせる
  nomination_type: string; // DBのカラム名に合わせる
  memo?: string;
  raw_body?: string;
}

interface DailyDetailProps {
  date: Date;
  dayNum: number;
  shift: any;
  reservations: Reservation[];
  theme: string;
}

export default function DailyDetail({ date, dayNum, shift, reservations, theme }: DailyDetailProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // 📍 その日の予約だけを抽出し、時間順に並べる
  const todayReservations = useMemo(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations
      .filter((r) => r.reservation_date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservations, date]);

  const accentColor = theme === 'pink' ? 'text-pink-400' : 
                      theme === 'blue' ? 'text-cyan-500' : 
                      theme === 'yellow' ? 'text-yellow-500' : 'text-gray-500';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* シフト概要枠 */}
      <section className="bg-white/60 backdrop-blur-md border border-white/40 rounded-[32px] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-white shadow-inner flex flex-col items-center justify-center font-black ${accentColor}`}>
              <span className="text-[10px] uppercase opacity-60">Day</span>
              <span className="text-xl -mt-1">{dayNum}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today's Shift</p>
              <h3 className="text-lg font-black text-gray-700 tracking-tighter">
                {shift?.start_time || '--:--'} 〜 {shift?.end_time || '--:--'}
              </h3>
            </div>
          </div>
          {shift?.status === 'official' && (
            <span className="bg-green-100 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">Confirmed</span>
          )}
        </div>
      </section>

      {/* 予約リストセクション */}
      <div className="space-y-2">
        <h4 className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Reservations</h4>
        
        {todayReservations.length > 0 ? (
          todayReservations.map((res) => {
            // 📍 記号判定ロジック
            const isSoine = res.course_info?.includes('添い寝');
            const typeLabel = isSoine ? '<添>' : '<か>';
            
            // 指名タイプの判定
            let sourceLabel = '<初>';
            if (res.nomination_type?.includes('本指名')) sourceLabel = '<本>';
            else if (res.nomination_type?.includes('フリー')) sourceLabel = '<F>';

            // 時間の整形 (HH:mm:ss -> HH:mm)
            const displayStart = res.start_time?.slice(0, 5) || '--:--';
            const displayEnd = res.end_time?.slice(0, 5) || '--:--';

            // 分数の抽出
            const duration = res.course_info?.match(/\d+/)?.[0] || '--';

            return (
              <div key={res.id} className="overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenId(openId === res.id ? null : res.id)}
                  className={`w-full bg-white border border-gray-50 rounded-[24px] p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all ${openId === res.id ? 'ring-2 ring-gray-100 shadow-md' : ''}`}
                >
                  <div className="flex items-center gap-1.5 text-[12.5px] font-black text-gray-700 overflow-hidden">
                    <span className={accentColor}>⏰</span>
                    <span className="text-blue-500 whitespace-nowrap">{typeLabel}</span>
                    <span className="tracking-tighter whitespace-nowrap">{displayStart}～{displayEnd}</span>
                    <span className="text-pink-400 whitespace-nowrap">{sourceLabel}</span>
                    <span className="truncate">{res.customer_name}様</span>
                    <span className="text-gray-400 font-bold whitespace-nowrap">{duration}分</span>
                  </div>
                  {openId === res.id ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
                </button>

                {/* 詳細表示（アコーディオン） */}
                {openId === res.id && (
                  <div className="bg-gray-50/50 rounded-b-[24px] mx-4 p-5 pt-4 border-x border-b border-gray-50 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Reservation Details</p>
                      <div className="text-[11px] font-bold text-gray-600 leading-relaxed whitespace-pre-wrap bg-white/50 p-3 rounded-xl border border-white">
                        {res.memo || res.raw_body || "詳細な備考情報はありません。"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No Reservations Yet</p>
          </div>
        )}
      </div>
    </div>
  );
}