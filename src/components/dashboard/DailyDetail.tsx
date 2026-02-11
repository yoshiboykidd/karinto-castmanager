'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X, MapPin, Tag, User, CreditCard, Home, UserCheck } from 'lucide-react';

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

  const getDuration = (info: string) => info?.match(/\d+/)?.[0] || '';

  // 📍 項目があるかチェックする関数
  const hasValue = (val: string) => val && val !== 'なし' && val !== '延長なし' && val !== 'なし ';

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

        {/* リスト表示側のヘッダー */}
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
                <span className="w-11 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white text-[13px] font-black shrink-0 tracking-tighter shadow-sm">確定</span>
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
        <div className="pt-2 border-t border-gray-100/50 space-y-1">
          {sortedReservations.length > 0 ? sortedReservations.map((res: any, idx: number) => (
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden">
              <Clock size={19} className="text-gray-300 shrink-0" />
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              <span className={`text-[13px] font-black w-11 h-7 flex items-center justify-center rounded-lg shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>{res.nomination_category || 'FREE'}</span>
              <div className="flex items-baseline shrink-0 font-black ml-0.5 text-gray-800">
                <span className="text-[19px]">{getDuration(res.course_info)}</span>
                <span className="text-[10px] ml-0.5 opacity-40 font-bold">分</span>
              </div>
              <div className="flex items-center tracking-tighter shrink-0 font-black text-gray-700 ml-0.5">
                <span className="text-[19px]">{res.start_time?.substring(0, 5)}</span>
                <span className="text-[10px] mx-0.5 opacity-30">〜</span>
                <span className="text-[19px]">{res.end_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-baseline truncate ml-0.5 text-gray-800">
                <span className="text-[17px] font-black">{res.customer_name}</span>
                <span className="text-[10px] font-bold text-gray-400 ml-0.5">様</span>
              </div>
            </button>
          )) : (
            <div className="py-2 text-center bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
              <p className="text-[10px] font-bold text-gray-300 italic uppercase tracking-widest">No Mission</p>
            </div>
          )}
        </div>
      </section>

      {/* 📍 詳細モーダル：バキバキ・肉厚デザイン */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[38px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 subpixel-antialiased">
            
            {/* ヘッダーセクション */}
            <div className={`p-6 pb-10 ${accentBg} relative`}>
              <button onClick={() => setSelectedRes(null)} className="absolute top-5 right-5 text-gray-400 active:scale-90 transition-transform"><X size={28} /></button>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[13px] font-black px-2 py-0.5 rounded-md ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`text-[13px] font-black px-2 py-0.5 rounded-md ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
              </div>

              <div className="flex items-baseline gap-1 text-gray-900">
                <span className="text-[40px] font-black tracking-tighter leading-none">{selectedRes.start_time?.substring(0, 5)}</span>
                <span className="text-[20px] font-black opacity-20 mx-1">/</span>
                <span className="text-[40px] font-black tracking-tighter leading-none">{selectedRes.end_time?.substring(0, 5)}</span>
              </div>
            </div>

            {/* ボディセクション */}
            <div className="bg-white px-6 py-8 -mt-6 rounded-t-[38px] relative space-y-6">
              
              {/* コース名：肉厚カード */}
              <div className="bg-gray-900 p-4 rounded-2xl shadow-lg shadow-gray-200 border-b-4 border-pink-500">
                <p className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-1">Reservation Course</p>
                <h3 className="text-[20px] font-black text-white leading-tight tracking-tight">
                  {selectedRes.course_info}
                </h3>
              </div>

              {/* グリッド情報：料金・場所・スタッフ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-gray-400 font-black text-[12px]"><CreditCard size={16}/> 料金合計</div>
                   <div className="flex items-baseline font-black text-gray-900">
                      <span className="text-sm mr-0.5">¥</span>
                      <span className="text-2xl tracking-tighter">{(selectedRes.total_price || 0).toLocaleString()}</span>
                   </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 mb-1 flex items-center gap-1"><MapPin size={12}/> ホテル</p>
                  <p className="text-[15px] font-black text-gray-800 truncate">{selectedRes.hotel_name || 'MR'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 mb-1 flex items-center gap-1"><UserCheck size={12}/> スタッフ</p>
                  <p className="text-[15px] font-black text-gray-800 truncate">{selectedRes.staff_name || '小笠原'}</p>
                </div>
              </div>

              {/* 変動項目：値がある時だけ表示 */}
              <div className="space-y-2 px-1">
                {hasValue(selectedRes.extension) && (
                  <div className="flex justify-between items-center font-black">
                    <span className="text-[12px] text-gray-400">＋ 延長設定</span>
                    <span className="text-[14px] text-orange-600">{selectedRes.extension}</span>
                  </div>
                )}
                {hasValue(selectedRes.discount) && (
                  <div className="flex justify-between items-center font-black">
                    <span className="text-[12px] text-gray-400">ー 割引適用</span>
                    <span className="text-[14px] text-red-500">{selectedRes.discount}</span>
                  </div>
                )}
                {hasValue(selectedRes.options) && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[12px] text-gray-400 font-black">★ 選択オプション</span>
                    <span className="text-[13px] font-black text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">{selectedRes.options}</span>
                  </div>
                )}
              </div>

              {/* 顧客情報カード：バキバキの濃色デザイン */}
              <div className="bg-gray-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12 group-hover:scale-110 transition-transform"><User size={70} className="text-white"/></div>
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Member Info</p>
                    <h4 className="text-[22px] font-black text-white tracking-tighter">{selectedRes.customer_name} 様</h4>
                    <p className="text-[12px] font-black text-pink-400 mt-1">no {selectedRes.customer_no || '---'}</p>
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-2xl backdrop-blur-sm text-center min-w-[70px]">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Visits</p>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-2xl font-black text-white">{selectedRes.visit_count || '0'}</span>
                      <span className="text-[10px] font-black text-gray-400">回</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* フッターボタン */}
            <div className="p-5 bg-gray-50 flex justify-center border-t border-gray-100">
              <button onClick={() => setSelectedRes(null)} className="w-full py-4 rounded-2xl bg-white border-2 border-gray-200 text-[14px] font-black text-gray-400 shadow-sm active:bg-gray-100 active:scale-[0.98] transition-all tracking-widest">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}