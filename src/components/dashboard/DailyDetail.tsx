'use client';

import { useState } from 'react';
import { format, startOfDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X, MapPin, User, Tag, CreditCard, History } from 'lucide-react';

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
      <section className="relative overflow-hidden rounded-[32px] border bg-white border-pink-100 shadow-xl p-3 pt-7 flex flex-col space-y-3 subpixel-antialiased">
        {(isKarin || isSoine) && (
          <div className={`absolute top-0 left-0 right-0 py-1 text-center font-black text-[10px] tracking-[0.2em] z-20 text-white ${isKarin ? 'bg-orange-500' : 'bg-yellow-500'}`}>
            {isKarin ? 'かりんとの日' : '添い寝の日'}
          </div>
        )}

        <div className="flex items-center gap-1.5 px-1">
          <h3 className="text-[26px] font-black text-gray-800 tracking-tighter [text-shadow:_0.4px_0_0_currentColor] shrink-0">
            {format(date, 'M/d')}<span className="text-sm opacity-60 ml-0.5 font-bold">({format(date, 'E', { locale: ja })})</span>
          </h3>
          {isOfficial && (
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[9px] font-black px-1 py-0.5 rounded bg-blue-500 text-white shrink-0">確定</span>
              <span className={`text-[24px] font-black tracking-tighter ${accentColor} [text-shadow:_0.6px_0_0_currentColor] leading-none truncate`}>
                {shift?.start_time}〜{shift?.end_time}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100/50 space-y-1">
          {reservations.length > 0 ? reservations.map((res: any, idx: number) => (
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden">
              <Clock size={19} className="text-gray-300 shrink-0" />
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              <span className={`text-[10px] font-black px-1.5 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.nomination_category)}`}>{res.nomination_category || 'FREE'}</span>
              
              <div className="flex items-baseline shrink-0 font-black text-gray-800 ml-0.5">
                <span className="text-[19px] leading-none [text-shadow:_0.3px_0_0_currentColor]">{getDuration(res.course_info)}</span>
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

      {/* 詳細モーダル（新カラム対応版） */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto subpixel-antialiased">
            <button onClick={() => setSelectedRes(null)} className="absolute top-5 right-5 text-gray-300"><X size={28} /></button>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservation Detail</p>
              <h4 className={`text-3xl font-black ${accentColor} tracking-tighter [text-shadow:_0.5px_0_0_currentColor]`}>
                {selectedRes.start_time?.substring(0, 5)}〜{selectedRes.end_time?.substring(0, 5)}
              </h4>
              <p className="text-sm font-bold text-gray-400">{selectedRes.shop_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 mb-1"><User size={12}/> CUSTOMER</div>
                <p className="text-lg font-black text-gray-800 leading-none">{selectedRes.customer_name} 様</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">No. {selectedRes.customer_no}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 mb-1"><History size={12}/> VISITS</div>
                <p className="text-lg font-black text-gray-800 leading-none">{selectedRes.visit_count}<span className="text-xs ml-0.5">回目</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                <div className="flex items-center gap-2">
                   <MapPin size={16} className="text-pink-400" />
                   <span className="text-sm font-black text-gray-700">{selectedRes.hotel_name || '---'}</span>
                </div>
                <div className="flex items-center gap-1">
                   <CreditCard size={16} className="text-gray-400" />
                   <span className="text-md font-black text-gray-800">¥{(selectedRes.total_price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 mb-1"><Tag size={12}/> COURSE / OPTIONS</div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700 leading-relaxed">
                <p className="border-b border-gray-200 pb-1 mb-1">{selectedRes.course_info}</p>
                {selectedRes.options && <p className="text-blue-600">＋ {selectedRes.options}</p>}
                {selectedRes.discount && <p className="text-red-500">ー {selectedRes.discount}</p>}
                {selectedRes.extension && <p className="text-orange-500 underline">延長: {selectedRes.extension}</p>}
              </div>
            </div>

            {selectedRes.memo && (
              <div className="pt-1">
                <div className="text-[10px] font-black text-gray-400 mb-1">MEMO</div>
                <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 text-sm font-medium text-gray-600 italic">
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