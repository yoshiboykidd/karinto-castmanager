'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X, MapPin, Tag, User, CreditCard, History, Home } from 'lucide-react';

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

  // 📍 予約を開始時間（早い順）にソート
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
        
        {/* 特定日バー */}
        {(isKarin || isSoine) && (
          <div className={`absolute top-0 left-0 right-0 py-1 text-center font-black text-[14px] tracking-[0.4em] z-20 text-white shadow-md [text-shadow:_1px_1px_0_rgba(0,0,0,0.2)]
            ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-600'}`}>
            {isKarin ? '★ かりんとの日 ★' : '★ 添い寝の日 ★'}
          </div>
        )}

        {/* ヘッダー：特大・中央配置 (数字28px / 記号14px) */}
        <div className="flex flex-col items-center justify-center w-full mt-1 mb-2">
          <div className="flex items-center justify-center gap-3 whitespace-nowrap">
            <div className="flex items-baseline font-black tracking-tighter [text-shadow:_0.5px_0_0_currentColor]">
              <span className="text-[28px] leading-none">{format(date, 'M')}</span>
              <span className="text-[14px] opacity-30 mx-0.5 font-bold">/</span>
              <span className="text-[28px] leading-none">{format(date, 'd')}</span>
              <span className="text-[12px] opacity-30 ml-0.5 font-bold">({format(date, 'E', { locale: ja })})</span>
            </div>

            {isOfficial ? (
              <div className="flex items-center gap-1.5">
                <span className="w-11 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white text-[13px] font-black shrink-0 tracking-tighter">確定</span>
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

        {/* 予約リスト：時刻順ソート済み */}
        <div className="pt-2 border-t border-gray-100/50 space-y-1">
          {sortedReservations.length > 0 ? sortedReservations.map((res: any, idx: number) => (
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden">
              <Clock size={19} className="text-gray-300 shrink-0" />
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
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

      {/* 予約詳細モーダル（肉厚・バキバキ版） */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 subpixel-antialiased">
            
            {/* モーダルヘッダー：時間・金額・バッジ */}
            <div className={`${accentColor.replace('text', 'bg').replace('500', '100')} p-5 pb-8 relative`}>
              <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-gray-400 active:text-gray-600"><X size={26} /></button>
              
              <div className="flex items-baseline gap-1 text-gray-800">
                <span className="text-[32px] font-black tracking-tighter">{selectedRes.start_time?.substring(0, 5)}</span>
                <span className="text-[16px] font-bold opacity-30 mx-1">〜</span>
                <span className="text-[32px] font-black tracking-tighter">{selectedRes.end_time?.substring(0, 5)}</span>
                <span className="ml-2 text-[14px] font-black opacity-40 uppercase tracking-widest">Detail</span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[13px] font-black w-10 h-7 flex items-center justify-center rounded-lg ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`text-[13px] font-black w-14 h-7 flex items-center justify-center rounded-lg ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
                <div className={`flex items-baseline ml-auto font-black ${accentColor} [text-shadow:_0.5px_0_0_currentColor]`}>
                  <span className="text-xl mr-0.5">¥</span>
                  <span className="text-3xl tracking-tight">{(selectedRes.total_price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* モーダルボディ：コース詳細・情報 */}
            <div className="bg-white px-5 py-6 -mt-4 rounded-t-[32px] relative space-y-5">
              
              {/* コース名 */}
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Current Course</p>
                <h3 className="text-[22px] font-black text-gray-800 leading-tight border-l-4 border-pink-500 pl-3">
                  {selectedRes.course_info}
                </h3>
              </div>

              {/* 詳細リスト */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[14px] font-bold">
                  <span className="text-gray-400">■ 延長</span>
                  <span className="text-gray-800">{selectedRes.extension || '延長なし'}</span>
                </div>
                <div className="flex justify-between items-center text-[14px] font-bold">
                  <span className="text-gray-400">■ 割引</span>
                  <span className={`text-gray-800 ${selectedRes.discount ? 'text-red-500' : ''}`}>{selectedRes.discount || 'なし'}</span>
                </div>
                <div className="flex justify-between items-center text-[14px] font-bold">
                  <span className="text-gray-400">■ オプション</span>
                  <span className="text-gray-800 truncate max-w-[180px]">{selectedRes.options || 'なし'}</span>
                </div>
                <div className="flex justify-between items-center text-[14px] font-black pt-2 border-t border-gray-50">
                  <span className="text-gray-400">■ 料金合計</span>
                  <span className="text-lg text-gray-800">{(selectedRes.total_price || 0).toLocaleString()}円</span>
                </div>
                <div className="flex justify-between items-center text-[14px] font-bold">
                  <span className="text-gray-400">■ ホテル / 場所</span>
                  <span className="text-pink-600 flex items-center gap-1"><MapPin size={14}/>{selectedRes.hotel_name || 'MR'}</span>
                </div>
                <div className="flex justify-between items-center text-[14px] font-bold">
                  <span className="text-gray-400">■ スタッフ</span>
                  <span className="text-gray-800">{selectedRes.staff_name || '小笠原'}</span>
                </div>
              </div>

              {/* 顧客情報カード */}
              <div className="bg-gray-50 rounded-[24px] p-4 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] rotate-12"><User size={80}/></div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Customer Info</p>
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-[20px] font-black text-gray-800 tracking-tight">{selectedRes.customer_name} 様</h4>
                    <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase">no {selectedRes.customer_no || '27752'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">Visits</p>
                    <div className="flex items-baseline gap-0.5 justify-end">
                      <span className={`text-2xl font-black ${accentColor}`}>{selectedRes.visit_count || '20'}</span>
                      <span className="text-[10px] font-bold text-gray-400">回</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="p-4 bg-gray-50/50 flex justify-center">
              <button onClick={() => setSelectedRes(null)} className="px-8 py-2.5 rounded-full bg-white border border-gray-200 text-[13px] font-black text-gray-400 shadow-sm active:scale-95 transition-all">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}