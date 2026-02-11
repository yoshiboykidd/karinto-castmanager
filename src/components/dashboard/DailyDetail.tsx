'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, MapPin, Calculator, Trash2, Copy, UserCheck, MessageSquare, Edit3 } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, reservations = [], theme = 'pink', supabase, onRefresh }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!selectedRes?.id) return;
    const ok = window.confirm("【注意】この予約を本当に取り消しますか？\n取り消すと一覧から完全に消去されます。");
    if (ok) {
      setIsDeleting(true);
      try {
        const { error } = await supabase.from('reservations').delete().eq('id', selectedRes.id);
        if (error) throw error;
        setSelectedRes(null);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error(err);
        alert("削除に失敗しました。");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      {/* 予約一覧リスト */}
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
            <div className="py-2 text-center text-gray-300 font-bold italic uppercase text-[10px]">No Mission</div>
          )}
        </div>
      </section>

      {/* 📍 詳細モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 overflow-y-auto bg-black/90 backdrop-blur-sm pt-6 pb-32">
          <div className="absolute inset-0" onClick={() => setSelectedRes(null)} />
          
          <div className="relative bg-white w-full max-w-[340px] rounded-[38px] overflow-hidden shadow-2xl animate-in zoom-in duration-150 subpixel-antialiased flex flex-col text-gray-800">
            
            {/* ヘッダー：横並び */}
            <div className={`p-4 pb-5 ${accentBg} flex items-center justify-center gap-3 relative border-b border-gray-100`}>
              <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-gray-300 active:text-gray-500"><X size={24} /></button>
              <div className="flex gap-1 shrink-0">
                <span className={`w-11 h-7 flex items-center justify-center rounded-lg text-[12px] font-black ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`w-11 h-7 flex items-center justify-center rounded-lg text-[12px] font-black ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
              </div>
              <div className="flex items-baseline gap-0.5 text-gray-900 font-black">
                <span className="text-[28px] tracking-tighter leading-none">{selectedRes.start_time?.substring(0, 5)}</span>
                <span className="text-[16px] opacity-20 font-bold mx-0.5">/</span>
                <span className="text-[28px] tracking-tighter leading-none">{selectedRes.end_time?.substring(0, 5)}</span>
              </div>
            </div>

            {/* ボディ */}
            <div className="px-5 py-3 bg-white space-y-2">
              <div className="text-center pt-1 border-b border-gray-50 pb-2">
                <h3 className="text-[22px] font-black text-gray-800 leading-tight tracking-tight italic">{selectedRes.course_info}</h3>
              </div>

              {/* 合計金額 ＆ ホテル */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">合計金額</p>
                  <div className="flex items-baseline font-black text-gray-900"><span className="text-sm mr-0.5">¥</span><span className="text-[38px] tracking-tighter leading-none">{(selectedRes.total_price || 0).toLocaleString()}</span></div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">Hotel</p>
                  <p className="text-[17px] font-black text-gray-800 truncate leading-none pt-1">{selectedRes.hotel_name || 'MR'}</p>
                </div>
              </div>

              {/* 📍 OP・割引・延長 (デザイン統一) */}
              {(hasValue(selectedRes.extension) || hasValue(selectedRes.discount) || hasValue(selectedRes.options)) && (
                <div className="bg-gray-50/50 rounded-xl p-2.5 space-y-1.5 border border-dashed border-gray-200">
                  {hasValue(selectedRes.extension) && <div className="flex justify-between items-center text-[13px] font-black"><span className="text-gray-400 text-[11px] font-bold">延長設定</span><span className="text-orange-600">{selectedRes.extension}</span></div>}
                  {hasValue(selectedRes.discount) && <div className="flex justify-between items-center text-[13px] font-black"><span className="text-gray-400 text-[11px] font-bold">割引金額</span><span className="text-red-500">¥{selectedRes.discount}</span></div>}
                  {hasValue(selectedRes.options) && <div className="flex justify-between items-center text-[13px] font-black border-t border-gray-100 pt-1.5"><span className="text-gray-400 text-[11px] font-bold">オプション</span><span className="text-blue-600 truncate max-w-[150px]">{selectedRes.options}</span></div>}
                </div>
              )}

              {/* 📍 DBメモ欄 (予約に対するメモ) */}
              {hasValue(selectedRes.memo) && (
                <div className="bg-yellow-50/50 p-2.5 rounded-xl border border-yellow-100 flex gap-2">
                  <MessageSquare size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-bold text-yellow-700 leading-tight">{selectedRes.memo}</p>
                </div>
              )}

              {/* 顧客情報カード */}
              <div className="bg-gray-900 rounded-[24px] p-3 text-white flex items-center justify-between gap-2 shadow-lg">
                <div className="flex items-baseline gap-1.5 shrink-0 pl-1"><span className="text-[18px] font-black tracking-tighter">{selectedRes.customer_name}</span><span className="text-[16px] font-black text-pink-400">{selectedRes.visit_count || '0'}回</span></div>
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/5 active:bg-white/20 transition-all">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">No</span>
                  <span className="text-[20px] font-black tracking-widest leading-none select-all text-white">{selectedRes.customer_no || '---'}</span>
                  <Copy size={13} className="text-gray-600 ml-0.5" />
                </div>
              </div>

              {/* スタッフ */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-300">
                <UserCheck size={12} className="opacity-40" />Staff: <span className="text-gray-400">{selectedRes.staff_name || '---'}</span>
              </div>
            </div>

            {/* フッターボタン */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
              {/* 📍 お客様メモボタン */}
              <button onClick={() => alert("お客様個別メモ(DB: customers.memo)を編集")} className="w-full h-12 rounded-xl bg-white border-2 border-pink-100 text-pink-500 flex items-center justify-center gap-2 font-black text-[14px] active:bg-pink-50 transition-all">
                <Edit3 size={18} /> お客様メモを残す
              </button>

              <button onClick={() => alert("OP計算君起動")} className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100 active:scale-95 transition-all">
                <Calculator size={20} /> OP計算君
              </button>
              
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className={`w-full h-10 rounded-xl text-gray-400 flex items-center justify-center gap-2 font-bold text-[12px] active:bg-rose-50 transition-all ${isDeleting ? 'opacity-50' : ''}`}
              >
                <Trash2 size={14} /> 予約を取り消す
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}