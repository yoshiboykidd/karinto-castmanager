'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calculator, Trash2, Copy, MessageSquare, Edit3, StickyNote, Save, Calendar } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, allShifts = [], reservations = [], theme = 'pink', supabase, onRefresh, myLoginId }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  
  const [visitInfo, setVisitInfo] = useState<{count: string | number, lastDate: string | null}>({
    count: '--', lastDate: null
  });

  if (!date) return null;

  // 特定日判定
  const eventInfo = useMemo(() => {
    const d = date.getDate();
    if (d === 10) return { label: 'かりんとの日', color: 'bg-[#FF9900]', text: 'text-white' };
    if (d === 11 || d === 22) return { label: '添い寝の日', color: 'bg-[#FFD700]', text: 'text-[#5C4033]' };
    const dateStr = format(date, 'yyyy-MM-dd');
    const dbFound = allShifts.find((s: any) => (s.shift_date === dateStr || s.date === dateStr) && (s.event_name || s.event));
    if (dbFound) return { label: dbFound.event_name || dbFound.event, color: 'bg-pink-500', text: 'text-white' };
    return null;
  }, [date, allShifts]);

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

  const hasValue = (val: string) => val && val !== 'なし' && val !== '延長なし' && val !== 'なし ' && val !== '';

  useEffect(() => {
    if (selectedRes && supabase && myLoginId) {
      const fetchHistory = async () => {
        const { data: history, error } = await supabase
          .from('reservations')
          .select('reservation_date')
          .eq('login_id', myLoginId)
          .eq('customer_no', selectedRes.customer_no)
          .order('reservation_date', { ascending: false });
        if (!error && history) {
          const count = history.length;
          const lastVisit = count > 1 ? history[1].reservation_date : null;
          setVisitInfo({ count: count === 1 ? '初' : count, lastDate: lastVisit ? format(parseISO(lastVisit), 'yyyy/MM/dd') : null });
        }
      };
      fetchHistory();
    }
  }, [selectedRes, supabase, myLoginId]);

  const handleSaveMemo = async () => {
    if (!selectedRes?.id) return;
    try {
      await supabase.from('reservations').update({ cast_memo: memoDraft }).eq('id', selectedRes.id);
      setIsEditingMemo(false);
      setSelectedRes({ ...selectedRes, cast_memo: memoDraft });
      if (onRefresh) onRefresh();
    } catch (err) { alert("保存に失敗しました。"); }
  };

  return (
    <>
      {/* 予約一覧リスト（上下をギリギリまで詰めた） */}
      <section className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl flex flex-col subpixel-antialiased">
        {eventInfo && <div className={`w-full py-1 ${eventInfo.color} ${eventInfo.text} text-center text-[12px] font-black tracking-widest uppercase`}>{eventInfo.label}</div>}
        <div className="flex items-center justify-center w-full p-2">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline font-black tracking-tighter text-gray-800 leading-none">
              <span className="text-[28px]">{format(date, 'M')}</span>
              <span className="text-[14px] mx-0.5 opacity-20">/</span>
              <span className="text-[28px]">{format(date, 'd')}</span>
              <span className="text-[12px] ml-0.5 opacity-30">({format(date, 'E', { locale: ja })})</span>
            </div>
            {isOfficial ? (
              <div className="flex items-center gap-1.5">
                <span className="w-10 h-6 flex items-center justify-center rounded bg-pink-500 text-white text-[11px] font-black">確定</span>
                <div className={`flex items-baseline font-black tracking-tighter ${accentColor} leading-none`}>
                  <span className="text-[24px]">{shift?.start_time}</span>
                  <span className="text-[12px] mx-0.5 opacity-20">〜</span>
                  <span className="text-[24px]">{shift?.end_time}</span>
                </div>
              </div>
            ) : <span className="text-[12px] font-black text-gray-200 uppercase tracking-widest ml-1">Day Off</span>}
          </div>
        </div>
        <div className="p-2 pt-0 space-y-1">
          {reservations.length > 0 ? [...reservations].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")).map((res: any, idx: number) => (
            <button key={idx} onClick={() => { setSelectedRes(res); setMemoDraft(res.cast_memo || ''); setIsEditingMemo(false); }} className="w-full bg-gray-50/50 rounded-xl p-1 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden text-gray-800">
              <span className={`text-[12px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0 ${getBadgeStyle(res.service_type)}`}>{res.service_type || 'か'}</span>
              <span className={`text-[12px] font-black w-10 h-6 flex items-center justify-center rounded shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>{res.nomination_category || 'FREE'}</span>
              <div className="flex items-center tracking-tighter shrink-0 font-black text-gray-700 ml-1">
                <span className="text-[17px]">{res.start_time?.substring(0, 5)}</span>
                <span className="text-[10px] mx-0.5 opacity-20">〜</span>
                <span className="text-[17px]">{res.end_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-baseline truncate ml-auto font-black">
                <span className="text-[16px]">{res.customer_name}</span>
                <span className="text-[9px] font-bold text-gray-400 ml-0.5">様</span>
              </div>
            </button>
          )) : <div className="py-1 text-center text-gray-200 font-bold italic text-[9px]">No Mission</div>}
        </div>
      </section>

      {/* 詳細モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 overflow-y-auto bg-black/90 backdrop-blur-sm pt-4 pb-24">
          <div className="absolute inset-0" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-150 flex flex-col text-gray-800">
            {eventInfo && <div className={`w-full py-1 ${eventInfo.color} ${eventInfo.text} text-center text-[11px] font-black tracking-widest uppercase`}>{eventInfo.label}</div>}
            
            {/* ヘッダー：1行レイアウト、余白詰め */}
            <div className="p-2 px-4 flex items-center justify-center gap-3 relative border-b border-gray-50">
              <button onClick={() => setSelectedRes(null)} className="absolute top-2 right-3 text-gray-300"><X size={20} /></button>
              <div className="flex gap-1 shrink-0">
                <span className={`w-10 h-6 flex items-center justify-center rounded text-[11px] font-black ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`w-10 h-6 flex items-center justify-center rounded text-[11px] font-black ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
              </div>
              <div className="flex items-baseline gap-0.5 font-black text-gray-900 leading-none">
                <span className="text-[28px] tracking-tighter">{selectedRes.start_time?.substring(0, 5)}</span>
                <span className="text-[18px] opacity-20 mx-0.5">/</span>
                <span className="text-[28px] tracking-tighter">{selectedRes.end_time?.substring(0, 5)}</span>
              </div>
            </div>

            <div className="px-4 py-2 space-y-2">
              <div className="text-center border-b border-gray-50 pb-1">
                <h3 className="text-[26px] font-black text-gray-800 leading-tight italic break-words">{selectedRes.course_info}</h3>
              </div>

              {/* ① 合計金額 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col justify-center text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">合計金額</p>
                  <div className="flex items-baseline justify-center font-black text-gray-900 leading-none">
                    <span className="text-xs mr-0.5">¥</span>
                    <span className="text-[32px] tracking-tighter">{(selectedRes.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col justify-center text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Hotel</p>
                  <p className="text-[16px] font-black text-gray-800 truncate">{selectedRes.hotel_name || 'MR'}</p>
                </div>
              </div>

              {/* ② OP/メモ */}
              {hasValue(selectedRes.memo) && (
                <div className="bg-yellow-50/50 p-2 rounded-lg border border-yellow-100 flex gap-1.5 text-left">
                  <MessageSquare size={12} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-bold text-yellow-700 italic">{selectedRes.memo}</p>
                </div>
              )}

              {/* ③ 顧客情報 */}
              <div className="bg-gray-900 rounded-[20px] p-2 px-3 text-white flex items-center justify-between gap-2 shadow-lg">
                <div className="flex flex-col shrink-0 text-left">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[17px] font-black tracking-tighter">{selectedRes.customer_name}</span>
                    <span className="text-[11px] font-bold text-gray-400">様</span>
                    <span className="text-[18px] font-black text-pink-400 leading-none ml-1">{visitInfo.count}</span>
                    <span className="text-[10px] font-bold text-gray-500">{visitInfo.count === '初' ? '' : '回目'}</span>
                  </div>
                  {visitInfo.lastDate && <p className="text-[9px] font-bold text-gray-500 italic flex items-center gap-1"><Calendar size={8}/>前回:{visitInfo.lastDate}</p>}
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/5 shrink-0">
                  <span className="text-[18px] font-black tracking-widest text-white leading-none">{selectedRes.customer_no || '---'}</span>
                  <Copy size={12} className="text-gray-600" />
                </div>
              </div>

              {/* ④ 保存済みキャストメモ */}
              {hasValue(selectedRes.cast_memo) && !isEditingMemo && (
                <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex gap-1.5 shadow-inner text-left">
                  <StickyNote size={12} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-bold text-blue-700 whitespace-pre-wrap">{selectedRes.cast_memo}</p>
                </div>
              )}

              {/* メモ入力フォーム（×で個別クローズ） */}
              {isEditingMemo && (
                <div className="bg-gray-50 p-2 rounded-xl border-2 border-pink-200 space-y-2 animate-in slide-in-from-top-1 duration-150">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-pink-400 uppercase">Memo Form</span>
                    <button onClick={() => setIsEditingMemo(false)} className="text-gray-300"><X size={18} /></button>
                  </div>
                  <textarea value={memoDraft} onChange={(e) => setMemoDraft(e.target.value)} className="w-full h-20 bg-white rounded-lg p-2 text-[16px] font-bold border border-gray-100 focus:outline-none" autoFocus />
                  <button onClick={handleSaveMemo} className="w-full h-10 bg-pink-500 text-white rounded-lg flex items-center justify-center gap-1 font-black text-[13px]"><Save size={16} /> 保存</button>
                </div>
              )}

              {/* ⑤ キャストメモボタン ＆ ⑥ OP計算君 */}
              <div className="space-y-1.5 pt-1">
                {!isEditingMemo && (
                  <button onClick={() => setIsEditingMemo(true)} className="w-full h-12 rounded-xl bg-white border-2 border-pink-100 text-pink-500 flex items-center justify-center gap-2 font-black text-[14px] shadow-sm">
                    <Edit3 size={18} /> キャストメモを残す
                  </button>
                )}
                <button onClick={() => alert("OP計算君起動")} className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100">
                  <Calculator size={20} /> OP計算君
                </button>
              </div>

              {/* ⑦ 予約取り消し */}
              <div className="pt-1">
                <button onClick={() => { if(window.confirm("消しますか？")) { /* delete logic */ } }} className="w-full h-10 rounded-xl text-gray-300 flex items-center justify-center gap-1 font-bold text-[11px]">
                  <Trash2 size={13} /> 予約を取り消す
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}