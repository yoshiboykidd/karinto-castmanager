'use client';

import { useState } from 'react';
import { format, startOfDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X, MapPin, User, Tag, CreditCard, History, Home } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, reservations = [], theme = 'pink' }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);

  if (!date) return null;

  const isOfficial = shift?.status === 'official';
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
      {/* メインの一覧表示（構成維持） */}
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-3 pt-7 flex flex-col space-y-3 subpixel-antialiased">
        <div className="flex items-center gap-1.5 px-1">
          <h3 className="text-[26px] font-black text-gray-800 tracking-tighter [text-shadow:_0.4px_0_0_currentColor] shrink-0">
            {format(date, 'M/d')}<span className="text-sm opacity-60 ml-0.5">({format(date, 'E', { locale: ja })})</span>
          </h3>
          {isOfficial && (
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[9px] font-black px-1 py-0.5 rounded bg-blue-500 text-white">確定</span>
              <span className={`text-[24px] font-black tracking-tighter ${accentColor} [text-shadow:_0.6px_0_0_currentColor] truncate leading-none`}>
                {shift?.start_time}〜{shift?.end_time}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100/50 space-y-1">
          {reservations.map((res: any, idx: number) => (
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden">
              <Clock size={19} className="text-gray-300 shrink-0" />
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              <span className={`text-[10px] font-black px-1.5 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.nomination_category)}`}>{res.nomination_category || 'FREE'}</span>
              <div className="flex items-baseline shrink-0 font-black text-gray-800 ml-0.5">
                <span className="text-[19px] [text-shadow:_0.3px_0_0_currentColor]">{getDuration(res.course_info)}</span>
                <span className="text-[10px] ml-0.5 opacity-40">分</span>
              </div>
              <div className="flex items-center tracking-tighter shrink-0 font-black text-gray-700 [text-shadow:_0.4px_0_0_currentColor] ml-0.5">
                <span className="text-[19px]">{res.start_time?.substring(0, 5)}</span>
                <span className="text-[10px] mx-0.5 opacity-30">〜</span>
                <span className="text-[19px]">{res.end_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-baseline truncate ml-0.5">
                <span className="text-[17px] font-black text-gray-800 tracking-tight [text-shadow:_0.3px_0_0_currentColor]">{res.customer_name}</span>
                <span className="text-[10px] font-bold text-gray-400 ml-0.5">様</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 超高密度モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[28px] p-4 shadow-2xl flex flex-col space-y-2.5 subpixel-antialiased">
            
            {/* 閉じるボタン（右上の隙間に配置） */}
            <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-gray-300 active:text-gray-500"><X size={24} /></button>
            
            {/* ヘッダー：時間と料金を一気に表示 */}
            <div className="pr-8">
              <div className="flex items-baseline gap-1">
                <h4 className={`text-3xl font-black ${accentColor} tracking-tighter [text-shadow:_0.5px_0_0_currentColor]`}>
                  {selectedRes.start_time?.substring(0, 5)}<span className="text-lg mx-0.5 opacity-30">〜</span>{selectedRes.end_time?.substring(0, 5)}
                </h4>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
                <div className={`flex items-baseline font-black ${accentColor}`}>
                   <span className="text-xs mr-0.5">¥</span>
                   <span className="text-xl tracking-tight">{(selectedRes.total_price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 中段グリッド：顧客と店舗情報を圧縮 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-baseline truncate">
                  <span className="text-lg font-black text-gray-800 tracking-tight">{selectedRes.customer_name}</span>
                  <span className="text-[10px] font-bold text-gray-400 ml-0.5 shrink-0">様</span>
                </div>
                <p className="text-[9px] font-black text-gray-300 leading-none mt-0.5">NO.{selectedRes.customer_no}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-baseline">
                  <span className="text-lg font-black text-gray-800 tracking-tighter">{selectedRes.visit_count}</span>
                  <span className="text-[10px] font-bold text-gray-400 ml-0.5">回目</span>
                </div>
                <p className="text-[9px] font-black text-gray-300 leading-none mt-0.5 uppercase tracking-tighter">Visit Count</p>
              </div>
            </div>

            {/* 場所・店舗（1行に集約） */}
            <div className="bg-pink-50/50 p-2.5 rounded-2xl border border-pink-100 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-1.5 truncate">
                <Home size={14} className="text-pink-300 shrink-0" />
                <span className="text-[11px] font-black text-gray-600 truncate">{selectedRes.shop_name}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate text-right">
                <MapPin size={14} className="text-pink-400 shrink-0" />
                <span className="text-[11px] font-black text-pink-600 truncate">{selectedRes.hotel_name || '---'}</span>
              </div>
            </div>

            {/* コース・オプション詳細（文字サイズを調整して圧縮） */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col space-y-1">
               <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 tracking-widest uppercase"><Tag size={10}/> Course Detail</div>
               <p className="text-[13px] font-bold text-gray-700 leading-tight border-b border-gray-200 pb-1 mb-1">{selectedRes.course_info}</p>
               <div className="grid grid-cols-1 gap-0.5">
                 {selectedRes.options && <p className="text-[11px] font-black text-blue-500 flex items-center gap-1"><span className="text-[8px] bg-blue-100 px-1 rounded">OPT</span> {selectedRes.options}</p>}
                 {selectedRes.discount && <p className="text-[11px] font-black text-red-500 flex items-center gap-1"><span className="text-[8px] bg-red-100 px-1 rounded">OFF</span> {selectedRes.discount}</p>}
                 {selectedRes.extension && <p className="text-[11px] font-black text-orange-500 flex items-center gap-1"><span className="text-[8px] bg-orange-100 px-1 rounded">EXT</span> {selectedRes.extension}</p>}
               </div>
            </div>

            {/* メモ：さらに小さく詰めて配置 */}
            {selectedRes.memo && (
              <div className="bg-yellow-50/50 p-3 rounded-2xl border border-yellow-100">
                <p className="text-[12px] font-medium text-gray-600 italic leading-snug">
                  <span className="text-[9px] font-black text-yellow-500 block not-italic mb-0.5 uppercase tracking-widest">Memo</span>
                  {selectedRes.memo}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}