'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X, MapPin, Tag } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, reservations = [], theme = 'pink' }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);

  if (!date) return null;

  const isOfficial = shift?.status === 'official';
  const themeColors: any = {
    pink: 'text-pink-500', blue: 'text-cyan-600', yellow: 'text-yellow-600',
    red: 'text-red-500', black: 'text-gray-800', white: 'text-gray-600'
  };
  const accentColor = themeColors[theme] || themeColors.pink;
  const accentBg = accentColor.replace('text', 'bg').replace('500', '50').replace('600', '50');

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

  const hasValue = (val: string) => val && val !== 'なし' && val !== '延長なし' && val !== 'なし ' && val !== '';

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-3 pt-8 flex flex-col space-y-1 subpixel-antialiased text-gray-800">
        <div className="flex items-center justify-center w-full mt-1 mb-2">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="flex items-baseline font-black tracking-tighter">
              <span className="text-[28px] leading-none">{format(date, 'M')}</span>
              <span className="text-[14px] opacity-30 mx-0.5 font-bold">/</span>
              <span className="text-[28px] leading-none">{format(date, 'd')}</span>
              <span className="text-[12px] opacity-30 ml-0.5 font-bold">({format(date, 'E', { locale: ja })})</span>
            </div>
            {isOfficial ? (
              <div className="flex items-center gap-1.5">
                <span className="w-11 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white text-[13px] font-black shrink-0 tracking-tighter shadow-sm">確定</span>
                <div className={`flex items-baseline font-black tracking-tighter ${accentColor}`}>
                  <span className="text-[28px] leading-none">{shift?.start_time}</span>
                  <span className="text-[14px] mx-1 opacity-20 font-bold">〜</span>
                  <span className="text-[28px] leading-none">{shift?.end_time}</span>
                </div>
              </div>
            ) : (
              <span className="text-[14px] font-black text-gray-200 italic uppercase tracking-[0.2em] leading-none">Day Off</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100/50 space-y-1">
          {sortedReservations.length > 0 ? sortedReservations.map((res: any, idx: number) => (
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden">
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              <span className={`text-[13px] font-black w-11 h-7 flex items-center justify-center rounded-lg shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>{res.nomination_category || 'FREE'}</span>
              <div className="flex items-center tracking-tighter shrink-0 font-black text-gray-700 ml-1">
                <span className="text-[19px]">{res.start_time?.substring(0, 5)}</span>
                <span className="text-[10px] mx-0.5 opacity-30">〜</span>
                <span className="text-[19px]">{res.end_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-baseline truncate ml-auto text-gray-800 font-black">
                <span className="text-[17px]">{res.customer_name}</span>
                <span className="text-[10px] font-bold text-gray-400 ml-0.5">様</span>
              </div>
            </button>
          )) : (
            <div className="py-2 text-center text-gray-300"><p className="text-[10px] font-bold italic">No Mission</p></div>
          )}
        </div>
      </section>

      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[38px] overflow-hidden shadow-2xl animate-in zoom-in duration-150">
            
            {/* ヘッダー */}
            <div className={`p-5 pb-8 ${accentBg} relative`}>
              <button onClick={() => setSelectedRes(null)} className="absolute top-5 right-5 text-gray-400"><X size={24} /></button>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[12px] font-black px-2 py-0.5 rounded ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`text-[12px] font-black px-2 py-0.5 rounded ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
              </div>
              <h2 className="text-[36px] font-black tracking-tighter text-gray-900 leading-none">
                {selectedRes.start_time?.substring(0, 5)} <span className="text-[20px] opacity-20 mx-1">/</span> {selectedRes.end_time?.substring(0, 5)}
              </h2>
              <p className="text-[14px] font-bold text-gray-500 mt-2 truncate">{selectedRes.course_info}</p>
            </div>

            {/* ボディ */}
            <div className="px-5 py-6 -mt-6 rounded-t-[38px] bg-white relative space-y-4">
              
              {/* 1. 料金 ＆ ホテル (同列) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Price</p>
                  <p className="text-[20px] font-black text-gray-900 leading-none">
                    <span className="text-sm mr-0.5">¥</span>{(selectedRes.total_price || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Hotel</p>
                  <p className="text-[16px] font-black text-gray-800 leading-none truncate mt-0.5">
                    {selectedRes.hotel_name || 'MR'}
                  </p>
                </div>
              </div>

              {/* 2. オプション・割引・延長 (ある場合のみ) */}
              {(hasValue(selectedRes.extension) || hasValue(selectedRes.discount) || hasValue(selectedRes.options)) && (
                <div className="space-y-1.5 px-1 py-1 border-b border-gray-50">
                  {hasValue(selectedRes.extension) && (
                    <div className="flex justify-between items-center text-[13px] font-bold">
                      <span className="text-gray-400">延長</span>
                      <span className="text-orange-600 font-black">{selectedRes.extension}</span>
                    </div>
                  )}
                  {hasValue(selectedRes.discount) && (
                    <div className="flex justify-between items-center text-[13px] font-bold">
                      <span className="text-gray-400">割引</span>
                      <span className="text-red-500 font-black">{selectedRes.discount}</span>
                    </div>
                  )}
                  {hasValue(selectedRes.options) && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-gray-400 font-bold">オプション</span>
                      <span className="text-[13px] font-black text-blue-600 leading-tight">{selectedRes.options}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. ユーザー情報 (黒カード) */}
              <div className="bg-gray-900 rounded-[28px] p-4 text-white">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h4 className="text-[20px] font-black tracking-tight">{selectedRes.customer_name} 様</h4>
                  <p className="text-[12px] font-bold text-pink-400">{selectedRes.visit_count || '0'}回目</p>
                </div>

                {/* 📍 バランスを最適化したNoエリア */}
                <div className="bg-white/10 rounded-2xl py-3 px-4 border border-white/10 text-center active:bg-white/20 transition-all">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Customer No</p>
                  <span className="text-[28px] font-black tracking-[0.15em] leading-none select-all block">
                    {selectedRes.customer_no || '---'}
                  </span>
                </div>
              </div>

              {/* 4. スタッフ (最下部) */}
              <div className="text-center pt-1">
                <p className="text-[11px] font-bold text-gray-300">
                  Staff: <span className="text-gray-400">{selectedRes.staff_name || '---'}</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button onClick={() => setSelectedRes(null)} className="w-full py-4 rounded-xl bg-white border border-gray-200 text-[13px] font-black text-gray-400">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}