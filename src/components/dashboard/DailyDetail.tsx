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
  const [selectedRes, setSelectedRes] = useState<any>(null); // 別窓用の状態

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

  // バッジの色設定
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

  // コース名から「分」だけを抽出するヘルパー（例：添い寝の日60分 → 60分）
  const formatDuration = (info: string) => {
    const match = info?.match(/\d+分/);
    return match ? match[0] : info;
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-4 pt-6 flex flex-col space-y-3 subpixel-antialiased">
        
        {(isKarin || isSoine) && (
          <div className={`absolute top-0 left-0 right-0 py-0.5 text-center font-black text-[10px] tracking-[0.2em] z-20 text-white
            ${isKarin ? 'bg-orange-500' : 'bg-yellow-500'}`}>
            {isKarin ? 'かりんとの日' : '添い寝の日'}
          </div>
        )}

        {/* 1. 日付と確定シフトを1行に集約 */}
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-xl font-black text-gray-800 tracking-tight [text-shadow:_0.3px_0_0_currentColor] shrink-0">
            {format(date, 'M/d')}
            <span className="text-sm opacity-70">({format(date, 'E', { locale: ja })})</span>
          </h3>
          {isOfficial && displayOfficialS !== 'OFF' ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-500 text-white shrink-0">確定シフト</span>
              <span className={`text-xl font-black tracking-tighter ${accentColor} [text-shadow:_0.5px_0_0_currentColor] truncate`}>
                {displayOfficialS}〜{displayOfficialE}
              </span>
            </div>
          ) : (
            <span className="text-sm font-black text-gray-300 italic uppercase">Day Off</span>
          )}
        </div>

        {/* 2. 本日の予約リスト（1行形式） */}
        {isOfficial && displayOfficialS !== 'OFF' && (
          <div className="pt-2 border-t border-gray-100/50 space-y-1.5">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">本日の予約</p>
            {reservations.length > 0 ? (
              reservations.map((res: any, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedRes(res)} // タップで別窓を開く
                  className="w-full bg-gray-50/50 rounded-xl p-2 px-3 border border-gray-100 flex items-center gap-2 shadow-sm active:bg-gray-100 transition-all overflow-hidden"
                >
                  <Clock size={12} className="text-gray-300 shrink-0" />
                  
                  {/* バッジ：か/添 */}
                  <span className={`text-[9px] font-black w-4 h-4 flex items-center justify-center rounded shrink-0 ${getBadgeStyle(res.category || 'か')}`}>
                    {res.category || 'か'}
                  </span>

                  {/* 時間 */}
                  <span className="text-[13px] font-black text-gray-700 tracking-tighter shrink-0 [text-shadow:_0.2px_0_0_currentColor]">
                    {res.start_time?.substring(0, 5)}〜{res.end_time?.substring(0, 5)}
                  </span>

                  {/* バッジ：種別 */}
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 ${getBadgeStyle(res.nomination_type || 'FREE')}`}>
                    {res.nomination_type || 'FREE'}
                  </span>

                  {/* コース時間（分）と名前 */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="text-[13px] font-black text-gray-700 shrink-0">{formatDuration(res.course_info)}</span>
                    <span className="text-[11px] font-bold text-gray-400 truncate">
                      {res.customer_name ? `${res.customer_name}様` : ''}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-3 text-center bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-gray-300 italic">No Data</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. 別窓（モーダル）：詳細表示 */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl space-y-4 subpixel-antialiased">
            <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
              <X size={24} />
            </button>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservation Detail</p>
              <h4 className={`text-2xl font-black ${accentColor} tracking-tighter`}>
                {selectedRes.start_time} - {selectedRes.end_time}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Customer</p>
                <p className="text-lg font-black text-gray-800">{selectedRes.customer_name || '---'} 様</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Type</p>
                <p className="text-lg font-black text-gray-800">{selectedRes.nomination_type || 'FREE'}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-black text-gray-400 uppercase">Course Info</p>
              <p className="text-md font-bold text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-100 mt-1">
                {selectedRes.course_info || '---'}
              </p>
            </div>

            {selectedRes.memo && (
              <div className="pt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Memo</p>
                <div className="text-sm font-medium text-gray-600 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mt-1 leading-relaxed">
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