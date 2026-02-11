'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, X, MapPin, Calculator, Trash2, AlertCircle } from 'lucide-react';

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

  // 取り消し処理（デモ用）
  const handleDelete = () => {
    const ok = window.confirm("【注意】この予約を本当に取り消しますか？\n取り消すと一覧から消去され、元に戻せません。");
    if (ok) {
      alert("予約を取り消しました。"); // ここにAPI処理
      setSelectedRes(null);
    }
  };

  return (
    <>
      {/* 予約一覧リスト（現状維持） */}
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
            <button key={idx} onClick={() => setSelectedRes(res)} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden text-gray-800">
              <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              <span className={`text-[13px] font-black w-11 h-7 flex items-center justify-center rounded-lg shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>{res.nomination_category || 'FREE'}</span>
              <div className="flex items-center tracking-tighter shrink-0 font-black text-gray-700 ml-1">
                <span className="text-[19px]">{res.start_time?.substring(0, 5)}</span>
                <span className="text-[10px] mx-0.5 opacity-30">〜</span>
                <span className="text-[19px]">{res.end_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-baseline truncate ml-auto font-black">
                <span className="text-[17px]">{res.customer_name}</span>
                <span className="text-[10px] font-bold text-gray-400 ml-0.5">様</span>
              </div>
            </button>
          )) : (
            <div className="py-2 text-center text-gray-300"><p className="text-[10px] font-bold italic uppercase">No Mission</p></div>
          )}
        </div>
      </section>

      {/* 📍 デザイン刷新版・詳細モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[38px] overflow-hidden shadow-2xl animate-in zoom-in duration-150 subpixel-antialiased">
            
            {/* ヘッダー：バッジと時間が横並び */}
            <div className={`p-5 pb-7 ${accentBg} border-b border-gray-100 relative`}>
              <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-gray-300 active:text-gray-500"><X size={24} /></button>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-black px-2 py-0.5 rounded ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                  <span className={`text-[12px] font-black px-2 py-0.5 rounded ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
                </div>
                <div className="flex items-baseline gap-1 text-gray-900 font-black">
                  <span className="text-[24px] tracking-tighter">{selectedRes.start_time?.substring(0, 5)}</span>
                  <span className="text-[14px] opacity-20 font-bold">〜</span>
                  <span className="text-[24px] tracking-tighter">{selectedRes.end_time?.substring(0, 5)}</span>
                </div>
              </div>
            </div>

            {/* ボディ */}
            <div className="p-5 space-y-5">
              
              {/* コース：大きく */}
              <div className="border-l-4 border-pink-500 pl-3">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Reservation Course</p>
                <h3 className="text-[22px] font-black text-gray-800 leading-tight tracking-tight">
                  {selectedRes.course_info}
                </h3>
              </div>

              {/* 料金（特大）＆ ホテル（横並び） */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">合計金額</p>
                  <div className="flex items-baseline font-black text-gray-900">
                    <span className="text-sm mr-0.5">¥</span>
                    <span className="text-[28px] tracking-tighter leading-none">{(selectedRes.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-end">
                  <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Hotel</p>
                  <p className="text-[16px] font-black text-gray-800 truncate leading-none mb-1">
                    {selectedRes.hotel_name || 'MR'}
                  </p>
                </div>
              </div>

              {/* 変動項目（ある時だけ） */}
              {(hasValue(selectedRes.extension) || hasValue(selectedRes.discount) || hasValue(selectedRes.options)) && (
                <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5 border border-dashed border-gray-200">
                  {hasValue(selectedRes.extension) && (
                    <div className="flex justify-between items-center text-[12px] font-bold">
                      <span className="text-gray-400">延長時間</span>
                      <span className="text-orange-600 font-black">{selectedRes.extension}</span>
                    </div>
                  )}
                  {hasValue(selectedRes.discount) && (
                    <div className="flex justify-between items-center text-[12px] font-bold">
                      <span className="text-gray-400">割引適用</span>
                      <span className="text-red-500 font-black">{selectedRes.discount}</span>
                    </div>
                  )}
                  {hasValue(selectedRes.options) && (
                    <div className="flex flex-col gap-0.5 pt-0.5 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Options</span>
                      <span className="text-[12px] font-black text-blue-600 leading-tight">{selectedRes.options}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 📍 顧客情報：薄く・1行に集約 */}
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-between text-gray-600">
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-[15px] font-black text-gray-800">{selectedRes.customer_name}</span>
                  <span className="text-[10px] font-bold text-gray-400">様</span>
                  <span className="text-[12px] font-black text-pink-400 ml-2">{selectedRes.visit_count || '0'}回</span>
                </div>
                {/* コピー用Noエリア */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm active:bg-gray-100">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">No</span>
                  <span className="text-[16px] font-black text-gray-900 tracking-wider select-all leading-none">
                    {selectedRes.customer_no || '---'}
                  </span>
                </div>
              </div>

              {/* スタッフ（最下部・控えめ） */}
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-gray-300 mt-2">
                <UserCheck size={12} /> Staff: <span className="text-gray-400">{selectedRes.staff_name || '---'}</span>
              </div>
            </div>

            {/* フッターボタン：2連 */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <button 
                onClick={() => alert("OP計算君を起動します")} // ここに計算機能
                className="w-full h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[14px] shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                <Calculator size={18} /> OP計算君
              </button>
              
              <button 
                onClick={handleDelete}
                className="w-full h-12 rounded-xl bg-white border-2 border-rose-100 text-rose-500 flex items-center justify-center gap-2 font-black text-[13px] active:bg-rose-50 active:scale-95 transition-all"
              >
                <Trash2 size={16} /> この予約を取り消す
              </button>

              <button onClick={() => setSelectedRes(null)} className="w-full pt-2 text-[12px] font-bold text-gray-300 hover:text-gray-400">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// アイコン用のダミー
function UserCheck({ size, className }: any) {
  return <span className={className}>👤</span>;
}