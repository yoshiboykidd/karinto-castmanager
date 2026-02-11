'use client';

import { format, startOfDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock } from 'lucide-react';

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

  // バッジの色設定用関数
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

  return (
    <section className={`relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-4 pt-6 flex flex-col space-y-2 transition-all duration-300 subpixel-antialiased`}>
      
      {(isKarin || isSoine) && (
        <div className={`absolute top-0 left-0 right-0 py-0.5 text-center font-black text-[10px] tracking-[0.2em] shadow-sm z-20
          ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      {/* 日付表示 */}
      <div className="flex items-center justify-between px-1 h-7 mt-0.5">
        <h3 className="text-xl font-black text-gray-800 tracking-tight leading-none flex items-baseline shrink-0 [text-shadow:_0.3px_0_0_currentColor]">
          {format(date, 'M/d')}
          <span className="text-base ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
      </div>

      {/* シフト時間 */}
      <div className="flex items-center justify-between px-1 h-10 gap-1">
        {isOfficial && displayOfficialS !== 'OFF' ? (
          <>
            <div className="shrink-0">
              <span className="text-[12px] font-black px-2.5 py-1.5 rounded-xl bg-blue-500 text-white shadow-md whitespace-nowrap">
                確定シフト
              </span>
            </div>
            <div className="flex-1 text-right overflow-hidden">
              <span className={`text-[31px] font-black leading-none tracking-tighter whitespace-nowrap inline-block align-middle ${accentColor} [text-shadow:_0.5px_0_0_currentColor]`}>
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
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">本日の予約</p>
            {reservations.length > 0 ? (
              reservations.map((res: any, idx: number) => (
                <div key={idx} className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 flex items-center shadow-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 時計アイコン */}
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    
                    {/* か/添 バッジ（データに区分があれば表示、なければ仮で表示） */}
                    <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md shrink-0 ${getBadgeStyle(res.category || 'か')}`}>
                      {res.category || 'か'}
                    </span>

                    {/* 時間 */}
                    <span className="text-sm font-black text-gray-700 tracking-tighter [text-shadow:_0.2px_0_0_currentColor]">
                      {res.start_time?.substring(0, 5)}〜{res.end_time?.substring(0, 5)}
                    </span>

                    {/* 指名種別バッジ */}
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${getBadgeStyle(res.nomination_type || 'FREE')}`}>
                      {res.nomination_type || 'FREE'}
                    </span>

                    {/* コース時間・お客様名 */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-gray-700">{res.course_info || '---'}分</span>
                      <span className="text-xs font-bold text-gray-400 truncate max-w-[80px]">
                        {res.customer_name ? `${res.customer_name}様` : '---'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-300 italic">予約データはありません ☕️</p>
              </div>
            )}
          </div>

          {/* 自動計算実績 */}
          {!isFuture && (
            <div className="bg-white/80 p-3 rounded-[24px] border border-pink-100 shadow-inner space-y-2">
              <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase">実績合計</span>
                <div className={`flex items-center ${accentColor}`}>
                  <span className="text-sm font-black mr-0.5 opacity-50">¥</span>
                  <span className="text-2xl font-black tracking-tighter [text-shadow:_0.4px_0_0_currentColor]">
                    {(shift?.reward_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[8px] font-black text-gray-300 uppercase">フリー</p>
                  <p className={`text-lg font-black ${accentColor}`}>{shift?.reward_f || 0}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-300 uppercase">初指名</p>
                  <p className={`text-lg font-black ${accentColor}`}>{shift?.reward_first || 0}</p>
                </div>
                <div>
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