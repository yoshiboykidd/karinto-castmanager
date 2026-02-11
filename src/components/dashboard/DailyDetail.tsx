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

  const formatDuration = (info: string) => {
    const match = info?.match(/\d+分/);
    return match ? match[0] : info;
  };

  return (
    <>
      {/* 全体の余白を少し広げて大きな文字に対応 */}
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-5 pt-7 flex flex-col space-y-4 subpixel-antialiased">
        
        {/* 特定日バッジ：大きく */}
        {(isKarin || isSoine) && (
          <div className={`absolute top-0 left-0 right-0 py-1 text-center font-black text-xs tracking-[0.2em] z-20 text-white
            ${isKarin ? 'bg-orange-500' : 'bg-yellow-500'}`}>
            {isKarin ? 'かりんとの日' : '添い寝の日'}
          </div>
        )}

        {/* 1. ヘッダー：日付とシフト時間をサイズアップ */}
        <div className="flex items-center gap-3 px-1">
          {/* 日付：XL → 26px */}
          <h3 className="text-[26px] font-black text-gray-800 tracking-tight [text-shadow:_0.4px_0_0_currentColor] shrink-0 flex items-baseline">
            {format(date, 'M/d')}
            <span className="text-base ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
          </h3>
          {isOfficial && displayOfficialS !== 'OFF' ? (
            <div className="flex items-center gap-2 overflow-hidden">
              {/* 確定バッジ：大きく */}
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500 text-white shrink-0 shadow-sm">確定シフト</span>
              {/* 時間：XL → 26px */}
              <span className={`text-[26px] font-black tracking-tighter ${accentColor} [text-shadow:_0.6px_0_0_currentColor] truncate leading-none`}>
                {displayOfficialS}〜{displayOfficialE}
              </span>
            </div>
          ) : (
            <span className="text-lg font-black text-gray-300 italic uppercase">Day Off</span>
          )}
        </div>

        {/* 2. 予約リスト：全体的にサイズアップ */}
        {isOfficial && displayOfficialS !== 'OFF' && (
          <div className="pt-3 border-t border-gray-100/50 space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">本日の予約</p>
            {reservations.length > 0 ? (
              reservations.map((res: any, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedRes(res)}
                  // 余白とギャップを広げる
                  className="w-full bg-gray-50/50 rounded-2xl p-3 px-4 border border-gray-100 flex items-center gap-3 shadow-sm active:bg-gray-100 transition-all overflow-hidden"
                >
                  {/* アイコン：大きく */}
                  <Clock size={16} className="text-gray-400 shrink-0" />
                  
                  {/* バッジ(か/添)：大きく (w-4 h-4 -> w-6 h-6) */}
                  <span className={`text-[12px] font-black w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${getBadgeStyle(res.category || 'か')}`}>
                    {res.category || 'か'}
                  </span>

                  {/* 時間：13px -> 17px */}
                  <span className="text-[17px] font-black text-gray-700 tracking-tighter shrink-0 [text-shadow:_0.4px_0_0_currentColor] leading-none">
                    {res.start_time?.substring(0, 5)}〜{res.end_time?.substring(0, 5)}
                  </span>

                  {/* バッジ(種別)：大きく */}
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md shrink-0 ${getBadgeStyle(res.nomination_type || 'FREE')}`}>
                    {res.nomination_type || 'FREE'}
                  </span>

                  {/* コース時間と名前：大きく */}
                  <div className="flex items-baseline gap-1.5 overflow-hidden">
                    {/* 時間(分)：13px -> 17px */}
                    <span className="text-[17px] font-black text-gray-800 shrink-0 leading-none">{formatDuration(res.course_info)}</span>
                    {/* 名前：11px -> 13px */}
                    <span className="text-[13px] font-bold text-gray-500 truncate">
                      {res.customer_name ? `${res.customer_name}様` : ''}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-4 text-center bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-300 italic">No Data</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. 別窓（モーダル） */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] p-7 shadow-2xl space-y-5 subpixel-antialiased">
            <button onClick={() => setSelectedRes(null)} className="absolute top-5 right-5 text-gray-300 hover:text-gray-500">
              <X size={28} />
            </button>
            
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Reservation Detail</p>
              <h4 className={`text-3xl font-black ${accentColor} tracking-tighter [text-shadow:_0.5px_0_0_currentColor]`}>
                {selectedRes.start_time?.substring(0, 5)} - {selectedRes.end_time?.substring(0, 5)}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-5 pt-2">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase mb-1">Customer</p>
                <p className="text-xl font-black text-gray-800">{selectedRes.customer_name || '---'} 様</p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase mb-1">Type</p>
                <span className={`text-sm font-black px-3 py-1 rounded-lg ${getBadgeStyle(selectedRes.nomination_type || 'FREE')}`}>
                  {selectedRes.nomination_type || 'FREE'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-black text-gray-400 uppercase mb-1">Course Info</p>
              <p className="text-lg font-bold text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100 leading-tight">
                {selectedRes.course_info || '---'}
              </p>
            </div>

            {selectedRes.memo && (
              <div className="pt-2">
                <p className="text-xs font-black text-gray-400 uppercase mb-1">Memo</p>
                <div className="text-base font-medium text-gray-600 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 leading-relaxed">
                  {selectedRes.memo}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}