'use client';

import { parseISO, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Heart, Star, Sparkles, MapPin } from 'lucide-react';

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

interface DashboardContentProps {
  date?: Date;
  dayNum?: number;
  shift?: any;
  reservations?: Reservation[];
}

// 【ここを修正！】DailyDetail ではなく DashboardContent に名前を合わせました
export default function DashboardContent({ 
  date = new Date(), 
  dayNum = new Date().getDate(), 
  shift, 
  reservations = [] 
}: DashboardContentProps) {
  
  const dayOfWeek = format(date, 'E', { locale: ja });
  const isSunday = dayOfWeek === '日';
  const isSaturday = dayOfWeek === '土';

  return (
    <div className="min-h-screen bg-[#FFFDFE] p-4 space-y-6 animate-in fade-in duration-700">
      
      {/* 日付・シフトヘッダー */}
      <div className="flex items-end justify-between px-2 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-pink-500 tracking-tighter drop-shadow-sm">
            {dayNum}
          </span>
          <span className={`text-sm font-black uppercase tracking-widest ${
            isSunday ? 'text-rose-400' : isSaturday ? 'text-blue-400' : 'text-pink-300'
          }`}>
            {dayOfWeek}day
          </span>
        </div>
        
        {shift ? (
          <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 px-4 py-2 rounded-2xl shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-xs font-black text-pink-600 italic">
              {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic tracking-[0.2em]">Offline</span>
        )}
      </div>

      {/* 予約リストエリア（サクラ色デザイン） */}
      <div className="space-y-4">
        {reservations.length > 0 ? (
          reservations.map((res) => (
            <div 
              key={res.id}
              className="group relative bg-[#FFF9FA] rounded-[32px] p-6 shadow-sm border border-pink-100 overflow-hidden active:scale-[0.98] transition-all"
            >
              <Heart className="absolute -right-2 -bottom-2 w-16 h-16 text-pink-200/20 rotate-12" />

              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-gray-800 tracking-tighter">
                      {res.start_time?.slice(0, 5)}
                    </span>
                    <span className="text-pink-200 font-black">»</span>
                    <span className="text-xl font-bold text-pink-300">
                      {res.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white bg-pink-400 px-2.5 py-1 rounded-lg shadow-sm">
                      {res.course_info}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-[9px] font-black text-pink-300 uppercase tracking-widest mb-1">Earnings</div>
                  <div className="text-2xl font-black text-gray-800 tracking-tighter">
                    <span className="text-sm mr-0.5">¥</span>
                    {res.total_price || '---'}
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between relative z-10">
                <div>
                  <div className="text-[9px] font-black text-pink-300 uppercase tracking-widest mb-1 italic">Guest</div>
                  <div className="text-2xl font-black text-gray-800">
                    {res.customer_name} <span className="text-xs font-bold text-pink-300 italic">sama</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-white border border-pink-50 px-4 py-2 rounded-2xl shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                    {res.location_info || '---'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <p className="text-[11px] font-black text-pink-200 uppercase tracking-[0.3em] italic">
              No Appointments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}