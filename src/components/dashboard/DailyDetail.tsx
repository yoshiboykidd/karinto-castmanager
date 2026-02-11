'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, reservations = [], theme = 'pink' }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);

  if (!date) return null;

  const isOfficial = shift?.status === 'official';
  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  const themeColors: any = {
    pink: 'text-pink-500', blue: 'text-cyan-600', yellow: 'text-yellow-600',
    red: 'text-red-500', black: 'text-gray-800', white: 'text-gray-600'
  };
  const accentColor = themeColors[theme] || themeColors.pink;

  // 📍 予約を時刻順（早い順）にソート
  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [reservations]);

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

  const getDuration = (info: string) => info?.match(/\d+/)?.[0] || '';

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-3 pt-8 flex flex-col space-y-1 subpixel-antialiased text-gray-800">
        
        {/* 特定日バー：py-1で狭く設定 */}
        {(isKarin || isSoine) && (
          <div className={`absolute top-0 left-0 right-0 py-1 text-center font-black text-[14px] tracking-[0.4em] z-20 text-white shadow-md [text-shadow:_1px_1px_0_rgba(0,0,0,0.2)]
            ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-600'}`}>
            {isKarin ? '★ かりんとの日 ★' : '★ 添い寝の日 ★'}
          </div>
        )}

        {/* 1. ヘッダー：中央配置、数字28px / 記号14px、確定バッジw-11 */}
        <div className="flex items-center justify-center w-full mt-1 mb-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {/* 日付セクション */}
            <div className="flex items-baseline font-black tracking-tighter [text-shadow:_0.5px_0_0_currentColor]">
              <span className="text-[28px] leading-none">{format(date, 'M')}</span>
              <span className="text-[14px] opacity-30 mx-0.5 font-bold">/</span>
              <span className="text-[28px] leading-none">{format(date, 'd')}</span>
              <span className="text-[14px] opacity-30 ml-0.5 font-bold">({format(date, 'E', { locale: ja })})</span>
            </div>

            {/* シフトセクション */}
            {isOfficial ? (
              <div className="flex items-center gap-1.5">
                {/* 📍 確定バッジ：指名バッジと同じ w-11 h-7 / 文字 13px */}
                <span className="w-11 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white text-[13px] font-black shrink-0 tracking-tighter shadow-sm">確定</span>
                <div className={`flex items-baseline font-black tracking-tighter ${accentColor} [text-shadow:_0.6px_0_0_currentColor]`}>
                  <span className="text-[28px] leading-none">{shift?.start_time}</span>
                  <span className="text-[14px] mx-1 opacity-20 font-bold">〜</span>
                  <span className="text-[28px] leading-none">{shift?.end_time}</span>
                </div>
              </div>
            ) : (
              <span className="text-[14px] font-black text-gray-200 italic uppercase tracking-[0.2em] leading-none ml-2">Day Off</span>
            )}
          </div>
        </div>

        {/* 2. 予約リスト：時刻順ソート済み、余白詰め */}
        <div className="pt-2 border-t border-gray-100/50 space-y-1">
          {sortedReservations.length > 0 ? sortedReservations.map((res: any, idx: number) => (
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden">
              <Clock size={19} className="text-gray-300 shrink-0" />
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              
              {/* 指名バッジ：w-11 h-7 / 文字 13px に拡大 */}
              <span className={`text-[13px] font-black w-11 h-7 flex items-center justify-center rounded-lg shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>
                {res.nomination_category || 'FREE'}
              </span>
              
              <div className="flex items-baseline shrink-0 font-black text-gray-800 ml-0.5">
                <span className="text-[19px] [text-shadow:_0.3px_0_0_currentColor]">{getDuration(res.course_info)}</span>
                <span className="text-[10px] ml-0.5 opacity-40 font-bold">分</span>
              </div>

              <div className="flex items-center tracking-tighter shrink-0 font-black text-gray-700 [text-shadow:_0.4px_0_0_currentColor] ml-0.5">
                <span className="text-[19px] leading-none">{res.start_time?.substring(0, 5)}</span>
                <span className="text-[10px] mx-0.5 opacity-30 font-bold">〜</span>
                <span className="text-[19px] leading-none">{res.end_time?.substring(0, 5)}</span>
              </div>

              <div className="flex items-baseline truncate ml-0.5">
                <span className="text-[17px] font-black text-gray-800 tracking-tight [text-shadow:_0.3px_0_0_currentColor]">{res.customer_name}</span>
                <span className="text-[10px] font-bold text-gray-400 ml-0.5 shrink-0">様</span>
              </div>
            </button>
          )) : (
            <div className="py-2 text-center bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
              <p className="text-[10px] font-bold text-gray-300 italic uppercase">No Mission</p>
            </div>
          )}
        </div>
      </section>

      {/* モーダル用スペース（内包：お客様の構成待ち） */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[28px] p-6 shadow-2xl animate-in zoom-in duration-200">
             <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-gray-300 active:text-gray-500"><X size={24} /></button>
             <h4 className="text-xl font-black">詳細構成 待機中</h4>
             <p className="text-sm font-bold mt-2">{selectedRes.start_time}〜{selectedRes.end_time}</p>
          </div>
        </div>
      )}
    </>
  );
}