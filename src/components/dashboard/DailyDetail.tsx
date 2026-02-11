'use client';

import { useState } from 'react';
import { format, startOfDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X } from 'lucide-react';

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
  const [selectedRes, setSelectedRes] = useState<any>(null);

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

  const getDurationNumber = (info: string) => {
    const match = info?.match(/\d+/);
    return match ? match[0] : '';
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-3 pt-7 flex flex-col space-y-3 subpixel-antialiased">
        
        {(isKarin || isSoine) && (
          <div className={`absolute top-0 left-0 right-0 py-1 text-center font-black text-[10px] tracking-[0.2em] z-20 text-white
            ${isKarin ? 'bg-orange-500' : 'bg-yellow-500'}`}>
            {isKarin ? 'かりんとの日' : '添い寝の日'}
          </div>
        )}

        {/* 1. 日付と確定シフトを1行に集約 */}
        <div className="flex items-center gap-1.5 px-1">
          <h3 className="text-[26px] font-black text-gray-800 tracking-tighter [text-shadow:_0.4px_0_0_currentColor] shrink-0">
            {format(date, 'M/d')}
            <span className="text-sm opacity-60 ml-0.5 font-bold">({format(date, 'E', { locale: ja })})</span>
          </h3>
          {isOfficial && displayOfficialS !== 'OFF' ? (
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[9px] font-black px-1 py-0.5 rounded bg-blue-500 text-white shrink-0">確定</span>
              <span className={`text-[24px] font-black tracking-tighter ${accentColor} [text-shadow:_0.6px_0_0_currentColor] truncate leading-none`}>
                {displayOfficialS}〜{displayOfficialE}
              </span>
            </div>
          ) : (
            <span className="text-sm font-black text-gray-300 italic uppercase ml-1">Day Off</span>
          )}
        </div>

        {/* 2. 本日の予約リスト（1行・高密度・サイズ統一） */}
        {isOfficial && displayOfficialS !== 'OFF' && (
          <div className="pt-2 border-t border-gray-100/50 space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-0.5">本日の予約</p>
            {reservations.length > 0 ? (
              reservations.map((res: any, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedRes(res)}
                  className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden"
                >
                  {/* ① アイコン：大きく (19pxに合わせる) */}
                  <Clock size={19} className="text-gray-300 shrink-0" />
                  
                  {/* ② バッジ(か/添)：大きく (h-7) */}
                  <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.category || 'か')}`}>
                    {res.category || 'か'}
                  </span>

                  {/* ③ バッジ(指名)：大きく (h-7に高さを合わせる) */}
                  <span className={`text-[10px] font-black px-1.5 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.nomination_type || 'FREE')}`}>
                    {res.nomination_type || 'FREE'}
                  </span>

                  {/* ④ コース時間：数字はデカく(19px)、分は極小(10px) */}
                  <div className="flex items-baseline shrink-0 font-black text-gray-800 ml-0.5">
                    <span className="text-[19px] leading-none [text-shadow:_0.3px_0_0_currentColor]">{getDurationNumber(res.course_info)}</span>
                    <span className="text-[10px] ml-0.5 opacity-40 font-bold">分</span>
                  </div>

                  {/* ⑤ 時間：数字はデカく(19px)、〜は極小(10px) */}
                  <div className="flex items-center tracking-tighter shrink-0 font-black text-gray-700 [text-shadow:_0.4px_0_0_currentColor] ml-0.5">
                    <span className="text-[19px] leading-none">{res.start_time?.substring(0, 5)}</span>
                    <span className="text-[10px] mx-0.5 opacity-30 font-bold">〜</span>
                    <span className="text-[19px] leading-none">{res.end_time?.substring(0, 5)}</span>
                  </div>

                  {/* ⑥ 名前：名前はデカく(17px)、様は極小(10px) */}
                  <div className="flex items-baseline truncate ml-0.5">
                    <span className="text-[17px] font-black text-gray-800 tracking-tight [text-shadow:_0.3px_0_0_currentColor]">{res.customer_name || '---'}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-0.5 shrink-0">様</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-2 text-center bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-gray-300 italic uppercase">No Mission</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 詳細モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] p-7 shadow-2xl space-y-4 subpixel-antialiased">
            <button onClick={() => setSelectedRes(null)} className="absolute top-5 right-5 text-gray-300 hover:text-gray-500"><X size={28} /></button>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservation Detail</p>
              <h4 className={`text-3xl font-black ${accentColor} tracking-tighter [text-shadow:_0.5px_0_0_currentColor]`}>{selectedRes.start_time}〜{selectedRes.end_time}</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Customer</p><p className="text-xl font-black text-gray-800">{selectedRes.customer_name || '---'} 様</p></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Type</p><span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded ${getBadgeStyle(selectedRes.nomination_type)}`}>{selectedRes.nomination_type}</span></div>
            </div>
            <div className="pt-2"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Course Info</p><p className="text-md font-bold text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-100">{selectedRes.course_info}</p></div>
            {selectedRes.memo && (
              <div className="pt-2"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Memo</p><div className="text-sm font-medium text-gray-600 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 leading-relaxed italic">{selectedRes.memo}</div></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}