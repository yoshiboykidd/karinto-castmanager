'use client';

import { useState } from 'react';
import { Clock, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Reservation {
  id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  course_minutes: number;
  type_label: string; // <か>, <添> など
  source_label: string; // <本>, <初>, <F> など
  notes?: string;
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

  // テーマごとのアクセント色設定
  const accentColor = theme === 'pink' ? 'text-pink-400' : 
                      theme === 'blue' ? 'text-cyan-500' : 
                      theme === 'yellow' ? 'text-yellow-500' : 'text-gray-500';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 📍 シフト概要枠（シンプルに維持） */}
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

      {/* 📍 予約リストセクション */}
      <div className="space-y-2">
        <h4 className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Reservations</h4>
        
        {reservations.length > 0 ? (
          reservations.map((res) => (
            <div key={res.id} className="overflow-hidden transition-all duration-300">
              {/* 概要一行（タップで開閉） */}
              <button
                onClick={() => setOpenId(openId === res.id ? null : res.id)}
                className={`w-full bg-white border border-gray-50 rounded-[24px] p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all ${openId === res.id ? 'ring-2 ring-gray-100 shadow-md' : ''}`}
              >
                <div className="flex items-center gap-2 text-[13px] font-black text-gray-700">
                  <span className={accentColor}>⏰</span>
                  <span className="text-blue-500 font-bold">{res.type_label}</span>
                  <span className="tracking-tighter">{res.start_time}～{res.end_time}</span>
                  <span className="text-pink-400 font-bold ml-1">{res.source_label}</span>
                  <span className="truncate max-w-[80px]">{res.customer_name}様</span>
                  <span className="text-gray-400 font-medium">{res.course_minutes}分</span>
                </div>
                {openId === res.id ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
              </button>

              {/* 詳細表示（アコーディオン） */}
              {openId === res.id && (
                <div className="bg-gray-50/50 rounded-b-[24px] mx-4 p-5 pt-4 border-x border-b border-gray-50 space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Start Time</p>
                      <p className="text-sm font-black text-gray-700">{res.start_time}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Course</p>
                      <p className="text-sm font-black text-gray-700">{res.course_minutes} min</p>
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Customer Notes / Email Contents</p>
                    <div className="text-[12px] font-bold text-gray-600 leading-relaxed whitespace-pre-wrap bg-white/50 p-3 rounded-xl">
                      {res.notes || "詳細な備考情報はありません。"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No Reservations Yet</p>
          </div>
        )}
      </div>
    </div>
  );
}