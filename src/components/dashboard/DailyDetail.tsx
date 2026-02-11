'use client';

import { format, startOfDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';

type DailyDetailProps = {
  date: Date;
  dayNum: number;
  shift: any; 
  reservations?: any[]; 
  theme?: string; 
};

export default function DailyDetail({
  date,
  dayNum,
  shift,
  reservations = [],
  theme = 'pink'
}: DailyDetailProps) {
  if (!date) return null;

  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const isFuture = isAfter(targetDate, today);

  const isOfficial = shift?.status === 'official';
  
  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  const themeColors: any = {
    pink: 'text-pink-500',
    blue: 'text-cyan-600',
    yellow: 'text-yellow-600',
    red: 'text-red-500',
    black: 'text-gray-800',
    white: 'text-gray-600'
  };
  const accentColor = themeColors[theme] || themeColors.pink;

  const displayOfficialS = shift?.start_time || 'OFF';
  const displayOfficialE = shift?.end_time || '';

  return (
    <section className={`relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-4 pt-6 flex flex-col space-y-2 transition-all duration-300`}>
      
      {(isKarin || isSoine) && (
        <div className={`absolute top-0 left-0 right-0 py-0.5 text-center font-black text-[10px] tracking-[0.2em] shadow-sm z-20
          ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      <div className="flex items-center justify-between px-1 h-7 mt-0.5">
        <h3 className="text-xl font-black text-gray-800 tracking-tight leading-none flex items-baseline shrink-0">
          {format(date, 'M/d')}
          <span className="text-base ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
      </div>

      <div className="flex items-center justify-between px-1 h-10 gap-1">
        {isOfficial && displayOfficialS !== 'OFF' ? (
          <>
            <div className="shrink-0">
              <span className="text-[12px] font-black px-2.5 py-1.5 rounded-xl bg-blue-500 text-white shadow-md whitespace-nowrap">
                確定シフト
              </span>
            </div>
            <div className="flex-1 text-right overflow-hidden">
              <span className={`text-[31px] font-black leading-none tracking-tighter whitespace-nowrap inline-block align-middle ${accentColor}`}>
                {displayOfficialS}〜{displayOfficialE}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-[12px] font-black px-3 py-1.5 rounded-xl bg-gray-400 text-white shadow-sm shrink-0">お休み</span>
            <span className="text-xs font-black text-gray-300 italic uppercase tracking-widest opacity-40">Day Off</span>
          </div>
        )}
      </div>

      {isOfficial && displayOfficialS !== 'OFF' && (
        <div className="pt-2 border-t border-gray-100/50 space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reservation Details</p>
            {reservations.length > 0 ? (
              reservations.map((res: any, idx: number) => (
                <div key={idx} className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 flex justify-between items-center shadow-sm">
                  <div className="flex flex-col">
                    {/* 📍 修正: 元のデザインサイズ(text-[10px])に戻し、キー名を修正 */}
                    <span className="text-[10px] font-bold text-gray-400 leading-none mb-1">
                      {res.start_time?.substring(0, 5)}〜{res.end_time?.substring(0, 5)}
                    </span>
                    {/* 📍 修正: キー名を course_info に修正 */}
                    <span className="text-sm font-black text-gray-700 leading-none">
                      {res.course_info || 'コース未定'}
                    </span>
                  </div>
                  <div className="text-right">
                    {/* 📍 修正: キー名を nomination_type に修正 */}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-white border border-pink-100 ${accentColor}`}>
                      {res.nomination_type || 'フリー'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-300 italic">予約データはありません ☕️</p>
              </div>
            )}
          </div>

          {!isFuture && (
            <div className="bg-white/80 p-3 rounded-[24px] border border-pink-100 shadow-inner space-y-2">
              <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase">自動計算の実績</span>
                <div className={`flex items-center ${accentColor}`}>
                  <span className="text-sm font-black mr-0.5 opacity-50">¥</span>
                  <span className="text-2xl font-black tracking-tighter">
                    {(shift?.reward_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-center">
                  <p className="text-[8px] font-black text-gray-300 uppercase">フリー</p>
                  <p className={`text-lg font-black ${accentColor}`}>{shift?.reward_f || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black text-gray-300 uppercase">初指名</p>
                  <p className={`text-lg font-black ${accentColor}`}>{shift?.reward_first || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black text-gray-300 uppercase">本指名</p>
                  <p className={`text-lg font-black ${accentColor}`}>{shift?.reward_main || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}