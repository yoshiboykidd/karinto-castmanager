'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X, MapPin, Tag, Home, CreditCard, History, User } from 'lucide-react';

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
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-3 pt-9 flex flex-col space-y-4 subpixel-antialiased">
        
        {/* 特定日バー：py-2からpy-1へ狭く、文字サイズは維持 */}
        {(isKarin || isSoine) && (
          <div className={`absolute top-0 left-0 right-0 py-1 text-center font-black text-[14px] tracking-[0.4em] z-20 text-white shadow-md [text-shadow:_1px_1px_0_rgba(0,0,0,0.2)]
            ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-600'}`}>
            {isKarin ? '★ かりんとの日 ★' : '★ 添い寝の日 ★'}
          </div>
        )}

        {/* ヘッダー：全体を大きく、すべてを中央に配置（比率は維持 28px/14px） */}
        <div className="flex flex-col items-center justify-center w-full px-1 mt-2">
          <div className="flex items-center justify-center gap-3 whitespace-nowrap">
            {/* 日付：数字28px / 記号14px */}
            <div className="flex items-baseline font-black text-gray-800 tracking-tighter [text-shadow:_0.5px_0_0_currentColor]">
              <span className="text-[28px] leading-none">{format(date, 'M')}</span>
              <span className="text-[14px] opacity-30 mx-0.5 font-bold">/</span>
              <span className="text-[28px] leading-none">{format(date, 'd')}</span>
              <span className="text-[14px] opacity-30 ml-0.5 font-bold">({format(date, 'E', { locale: ja })})</span>
            </div>

            {/* シフト時間：確定バッジとセットで中央表示 */}
            {isOfficial ? (
              <div className="flex items-center gap-1.5">
                {/* 確定バッジ：指名バッジと同じ w-11 h-7 に統一 */}
                <span className="w-11 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white text-[10px] font-black shrink-0">確定</span>
                <div className={`flex items-baseline font-black tracking-tighter ${accentColor} [text-shadow:_0.6px_0_0_currentColor]`}>
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

        {/* 予約リスト */}
        <div className="pt-2 border-t border-gray-100/50 space-y-1.5">
          {reservations.length > 0 ? reservations.map((res: any, idx: number) => (
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden">
              <Clock size={19} className="text-gray-300 shrink-0" />
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              <span className={`text-[10px] font-black w-11 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.nomination_category)}`}>{res.nomination_category || 'FREE'}</span>
              
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
            <div className="py-4 text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
              <p className="text-[11px] font-bold text-gray-300 italic uppercase tracking-[0.2em]">No Mission</p>
            </div>
          )}
        </div>
      </section>

      {/* 詳細モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[28px] p-4 shadow-2xl flex flex-col space-y-3 subpixel-antialiased">
            <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-gray-300"><X size={24} /></button>
            <div className="pr-8 text-gray-800">
              <h4 className={`text-3xl font-black ${accentColor} tracking-tighter [text-shadow:_0.5px_0_0_currentColor]`}>
                {selectedRes.start_time?.substring(0, 5)}<span className="text-lg mx-0.5 opacity-30 font-bold">〜</span>{selectedRes.end_time?.substring(0, 5)}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
                <div className={`flex items-baseline font-black ${accentColor} ml-1`}>
                   <span className="text-xs mr-0.5">¥</span>
                   <span className="text-xl tracking-tight">{(selectedRes.total_price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-baseline truncate"><span className="text-lg font-black text-gray-800 tracking-tight">{selectedRes.customer_name}</span><span className="text-[10px] font-bold text-gray-400 ml-0.5 shrink-0">様</span></div>
                <p className="text-[9px] font-black text-gray-300 uppercase leading-none mt-0.5">No.{selectedRes.customer_no}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 text-center flex flex-col justify-center">
                <div className="flex items-baseline justify-center font-black text-gray-800 tracking-tighter"><span className="text-lg">{selectedRes.visit_count}</span><span className="text-[10px] font-bold text-gray-400 ml-0.5">回目</span></div>
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-tighter leading-none mt-0.5">Visits</p>
              </div>
            </div>
            <div className="bg-pink-50/50 p-2.5 rounded-2xl border border-pink-100 flex items-center justify-between gap-2 overflow-hidden text-gray-600">
              <div className="flex items-center gap-1.5 truncate"><Home size={14} className="text-pink-300 shrink-0" /><span className="text-[11px] font-black truncate">{selectedRes.shop_name}</span></div>
              <div className="flex items-center gap-1.5 truncate text-right"><MapPin size={14} className="text-pink-400 shrink-0" /><span className="text-[11px] font-black text-pink-600 truncate">{selectedRes.hotel_name || '---'}</span></div>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col space-y-1 text-center">
               <div className="flex items-center justify-center gap-1 text-[9px] font-black text-gray-400 tracking-widest uppercase"><Tag size={10}/> Course Details</div>
               <p className="text-[13px] font-bold text-gray-700 border-b border-gray-200 pb-1 mb-1">{selectedRes.course_info}</p>
               <div className="flex justify-center gap-2 text-[11px] font-black items-baseline">
                 {selectedRes.options && <p className="text-blue-500">＋ {selectedRes.options}</p>}
                 {selectedRes.discount && <p className="text-red-500">ー {selectedRes.discount}</p>}
                 {selectedRes.extension && <p className="text-orange-500 underline text-[10px]">延: {selectedRes.extension}</p>}
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}