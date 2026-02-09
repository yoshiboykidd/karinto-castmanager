'use client';

import { parseISO, format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Reservation {
  id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  course_info: string;
  total_price: string;
  location_info: string;
  nomination_type: string;
  option_info: string;
  discount_info: string;
}

interface DailyDetailProps {
  date: Date;
  dayNum: number;
  shift?: any;
  reservations: Reservation[];
}

export default function DailyDetail({ date, dayNum, shift, reservations }: DailyDetailProps) {
  // 曜日を取得
  const dayOfWeek = format(date, 'E', { locale: ja });
  const isSunday = dayOfWeek === '日';
  const isSaturday = dayOfWeek === '土';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 日付・シフトヘッダー */}
      <div className="flex items-end justify-between px-1">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-gray-800 tracking-tighter">
            {dayNum}
          </span>
          <span className={`text-sm font-bold ${
            isSunday ? 'text-red-400' : isSaturday ? 'text-blue-400' : 'text-gray-400'
          }`}>
            {dayOfWeek}day
          </span>
        </div>
        
        {shift ? (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-pink-100 px-3 py-1.5 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-xs font-black text-gray-600 italic">
              {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
            </span>
          </div>
        ) : (
          <span className="text-xs font-bold text-gray-300 italic">No Shift Scheduled</span>
        )}
      </div>

      {/* 予約リストエリア */}
      <div className="space-y-4">
        {reservations.length > 0 ? (
          reservations.map((res) => (
            <div 
              key={res.id}
              className="group relative bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(255,182,193,0.2)] border border-pink-50 overflow-hidden active:scale-[0.98] transition-all"
            >
              {/* 装飾用のアクセント */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-pink-300 to-pink-100" />

              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-gray-800 tracking-tight">
                      {res.start_time?.slice(0, 5)}
                    </span>
                    <span className="text-gray-300 font-light">→</span>
                    <span className="text-lg font-bold text-gray-400">
                      {res.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-50 px-2 py-0.5 rounded">
                      {res.course_info}
                    </span>
                    <span className="text-[10px] font-bold text-gray-300">
                      / {res.nomination_type || 'FREE'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-300 uppercase tracking-tighter mb-1">Total Price</div>
                  <div className="text-lg font-black text-gray-800 tracking-tighter">
                    {res.total_price || '---'}
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-300 uppercase mb-1">Customer</div>
                  <div className="text-xl font-black text-gray-800">
                    {res.customer_name} <span className="text-sm font-bold text-gray-400 ml-0.5">様</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-2xl">
                  <span className="text-base">📍</span>
                  <span className="text-xs font-black text-gray-600 uppercase tracking-tight">
                    {res.location_info || '---'}
                  </span>
                </div>
              </div>

              {/* オプション・割引がある場合 */}
              {(res.option_info || res.discount_info) && (
                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex gap-2">
                  {res.option_info && (
                    <span className="text-[9px] font-bold text-pink-400 border border-pink-100 px-2 py-1 rounded-md">
                      ✨ {res.option_info}
                    </span>
                  )}
                  {res.discount_info && (
                    <span className="text-[9px] font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded-md">
                      🎁 {res.discount_info}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
              <span className="text-xl text-pink-200">✉️</span>
            </div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">
              No Reservations Yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}