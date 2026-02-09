'use client';

import { format } from 'date-fns';
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
}

interface DailyDetailProps {
  date: Date;
  dayNum: number;
  shift?: any;
  reservations: Reservation[];
}

export default function DailyDetail({ date, dayNum, shift, reservations }: DailyDetailProps) {
  const dayOfWeek = format(date, 'E', { locale: ja });

  return (
    <div className="space-y-4 text-gray-800">
      {/* 日付とシフトのヘッダー：シンプルに整理 */}
      <div className="flex items-baseline justify-between border-b border-gray-100 pb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tighter">{dayNum}</span>
          <span className="text-xs font-bold text-gray-400 uppercase">{dayOfWeek}day</span>
        </div>
        {shift ? (
          <div className="text-[10px] font-black bg-gray-900 text-white px-2 py-1 rounded-md tracking-widest">
            {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
          </div>
        ) : (
          <span className="text-[10px] font-bold text-gray-300 italic">No Shift</span>
        )}
      </div>

      {/* 予約リスト：カードの影を消し、境界線と余白で表現 */}
      <div className="space-y-3">
        {reservations.length > 0 ? (
          reservations.map((res) => (
            <div key={res.id} className="bg-white border border-gray-200 rounded-2xl p-4 transition-active active:scale-[0.98]">
              <div className="flex justify-between items-start mb-3">
                <div className="text-xl font-black tracking-tight">
                  {res.start_time?.slice(0, 5)} <span className="text-gray-300 font-light">/</span> {res.end_time?.slice(0, 5)}
                </div>
                <div className="text-[10px] font-bold border border-gray-800 px-2 py-0.5 rounded">
                  {res.course_info}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <div className="text-lg font-bold">{res.customer_name} 様</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{res.nomination_type}</div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <span className="text-xs">📍</span>
                  <span className="text-xs font-bold text-gray-600 uppercase">{res.location_info || '---'}</span>
                </div>
                <div className="text-sm font-black text-gray-900">
                  {res.total_price}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">No Reservations</p>
          </div>
        )}
      </div>
    </div>
  );
}