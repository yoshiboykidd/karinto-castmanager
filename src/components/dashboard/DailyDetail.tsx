'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calculator, Trash2, Copy, MessageSquare, Edit3, StickyNote, Save, Calendar, UserCheck } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, allShifts = [], reservations = [], theme = 'pink', supabase, onRefresh, myLoginId }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  
  const [visitInfo, setVisitInfo] = useState<{count: string | number, lastDate: string | null}>({
    count: '--', lastDate: null
  });

  if (!date) return null;

  // 📍 執念の特定日（イベント名）抽出ロジック
  const eventName = useMemo(() => {
    if (!allShifts || allShifts.length === 0) return null;
    const targetDate = format(date, 'yyyy-MM-dd');
    const foundShift = allShifts.find((s: any) => {
      const sDate = String(s.shift_date || s.date || "");
      return sDate.includes(targetDate) && (s.event_name || s.event || s.event_title);
    });
    return foundShift?.event_name || foundShift?.event || foundShift?.event_title || null;
  }, [date, allShifts]);

  const isOfficial = shift?.status === 'official';

  // 📍 イベントに応じたヘッダー配色スタイルを定義
  const headerStyle = useMemo(() => {
    if (eventName?.includes('かりん')) {
      return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600',subText: 'text-orange-100' };
    }
    if (eventName?.includes('添い寝')) {
      return { bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-500', subText: 'text-yellow-700' };
    }
    
    // 通常時のテーマカラー設定
    const themeColors: any = {
      pink: { bg: 'bg-pink-50', text: 'text-pink-500', border: 'border-pink-100', subText: 'text-pink-300' },
      blue: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', subText: 'text-cyan-400' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', subText: 'text-yellow-400' },
      red: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100', subText: 'text-red-300' },
      black: { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-700', subText: 'text-gray-400' },
      white: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', subText: 'text-gray-400' },
    };
    // イベントがある場合は少し濃くする、なければ通常の薄い色
    if (eventName) {
       const base = themeColors[theme] || themeColors.pink;
       return { ...base, bg: base.bg.replace('50', '500'), text: 'text-white', subText: 'text-white/70' };
    }
    return themeColors[theme] || themeColors.pink;

  }, [eventName, theme]);

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

  // 個人履歴取得
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
          setVisitInfo({
            count: count === 1 ? '初' : count,
            lastDate: lastVisit ? format(parseISO(lastVisit), 'yyyy/MM/dd') : null
          });
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

  const handleDelete = async () => {
    if (!selectedRes?.id) return;
    if (window.confirm("この予約を本当に取り消しますか？")) {
      setIsDeleting(true);
      try {
        await supabase.from('reservations').delete().eq('id', selectedRes.id);
        setSelectedRes(null);
        if (onRefresh) onRefresh();
      } finally { setIsDeleting(false); }
    }
  };

  return (
    <>
      <section className={`relative overflow-hidden rounded-[32px] border shadow-xl flex flex-col subpixel-antialiased bg-white ${headerStyle.border}`}>
        
        {/* 📍 ヘッダー帯：イベントに応じた色を適用 */}
        <div className={`w-full p-3 py-4 flex items-center justify-center gap-3 ${headerStyle.bg} ${headerStyle.text} transition-colors duration-300`}>
          
          {/* 日付表示 */}
          <div className="flex items-baseline font-black tracking-tighter leading-none">
            <span className="text-[28px]">{format(date, 'M')}</span>
            <span className={`text-[14px] mx-0.5 ${headerStyle.subText}`}>/</span>
            <span className="text-[28px]">{format(date, 'd')}</span>
            <span className={`text-[12px] ml-0.5 ${headerStyle.subText}`}>({format(date, 'E', { locale: ja })})</span>
          </div>

          {/* 📍 イベント名（テキストで表示） */}
          {eventName && (
            <span className="text-[16px] font-black tracking-tight">{eventName}</span>
          )}

          {/* 確定 ＆ シフト時間 */}
          {isOfficial ? (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-11 h-7 flex items-center justify-center rounded-lg bg-white/20 text-[13px] font-black shrink-0 tracking-tighter shadow-sm backdrop-blur-sm">確定</span>
              <div className="flex items-baseline font-black tracking-tighter">
                <span className="text-[24px] leading-none">{shift?.start_time}</span>
                <span className={`text-[14px] mx-0.5 ${headerStyle.subText}`}>〜</span>
                <span className="text-[24px] leading-none">{shift?.end_time}</span>
              </div>
            </div>
          ) : (
            <span className={`text-[14px] font-black uppercase tracking-[0.2em] leading-none ml-2 ${headerStyle.subText}`}>Day Off</span>
          )}
        </div>

        <div className="p-3 pt-1 space-y-1 text-gray-800">
          {reservations.length > 0 ? [...reservations].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")).map((res: any, idx: number) => (
            <button key={idx} onClick={() => { setSelectedRes(res); setMemoDraft(res.cast_memo || ''); setIsEditingMemo(false); }} className="w-full bg-gray-50/50 rounded-xl p-1.5 px-2 border border-gray-100 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all overflow-hidden text-gray-800 text-left">
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

      {/* 詳細モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 overflow-y-auto bg-black/90 backdrop-blur-sm pt-6 pb-32">
          <div className="absolute inset-0" onClick={() => setSelectedRes(null)} />
          <div className="relative bg-white w-full max-w-[340px] rounded-[38px] overflow-hidden shadow-2xl animate-in zoom-in duration-150 flex flex-col text-gray-800">
            
            {/* 📍 モーダルヘッダーもイベント色に対応 */}
            <div className={`p-4 pb-5 ${headerStyle.bg} ${headerStyle.text} flex flex-col items-center justify-center gap-2 relative border-b ${headerStyle.border} transition-colors duration-300`}>
              <button onClick={() => setSelectedRes(null)} className={`absolute top-4 right-4 opacity-70 hover:opacity-100 ${headerStyle.text}`}><X size={24} /></button>
              
              {/* イベント名表示 */}
              {eventName && <span className="text-[14px] font-black tracking-tight opacity-90">{eventName}</span>}

              <div className="flex gap-1 shrink-0 mt-1">
                <span className={`w-11 h-7 flex items-center justify-center rounded-lg text-[12px] font-black shadow-sm ${getBadgeStyle(selectedRes.service_type)}`}>{selectedRes.service_type || 'か'}</span>
                <span className={`w-11 h-7 flex items-center justify-center rounded-lg text-[12px] font-black shadow-sm ${getBadgeStyle(selectedRes.nomination_category)}`}>{selectedRes.nomination_category || 'FREE'}</span>
              </div>
              <div className="flex items-baseline gap-0.5 font-black">
                <span className="text-[28px] tracking-tighter leading-none">{selectedRes.start_time?.substring(0, 5)}</span>
                <span className={`text-[16px] opacity-50 mx-0.5 ${headerStyle.subText}`}>/</span>
                <span className="text-[28px] tracking-tighter leading-none">{selectedRes.end_time?.substring(0, 5)}</span>
              </div>
            </div>

            <div className="px-5 py-3 bg-white space-y-2">
              <div className="text-center pt-1 border-b border-gray-50 pb-2">
                <h3 className="text-[22px] font-black text-gray-800 leading-tight italic">{selectedRes.course_info}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-gray-400 mb-0.5 uppercase tracking-widest text-center">合計金額</p>
                  <div className="flex items-baseline justify-center font-black text-gray-900">
                    <span className="text-sm mr-0.5">¥</span>
                    <span className="text-[38px] tracking-tighter leading-none">{(selectedRes.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center text-center">
                  <p className="text-[9px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">Hotel</p>
                  <p className="text-[17px] font-black text-gray-800 truncate leading-none pt-1">{selectedRes.hotel_name || 'MR'}</p>
                </div>
              </div>

              {/* 顧客情報カード */}
              <div className="bg-gray-900 rounded-[24px] p-3 text-white flex items-center justify-between gap-2 shadow-lg relative">
                <div className="flex flex-col shrink-0 pl-1 text-left">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[18px] font-black tracking-tighter">{selectedRes.customer_name}</span>
                    <span className="text-[12px] font-bold text-gray-500">様</span>
                    <div className="flex items-baseline gap-0.5 ml-1">
                      <span className="text-[20px] font-black text-pink-400 leading-none">{visitInfo.count}</span>
                      <span className="text-[11px] font-bold text-gray-500">{visitInfo.count === '初' ? '' : '回目'}</span>
                    </div>
                  </div>
                  {visitInfo.lastDate && (
                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5 italic">
                      <Calendar size={10}/> 前回会った日: {visitInfo.lastDate}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/5 active:bg-white/20 transition-all shrink-0">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">No</span>
                  <span className="text-[20px] font-black tracking-widest leading-none select-all text-white">{selectedRes.customer_no || '---'}</span>
                  <Copy size={13} className="text-gray-600 ml-0.5" />
                </div>
              </div>

              {/* メモ ＆ フォーム（ズーム対策 16px） */}
              <div className="space-y-2">
                {hasValue(selectedRes.memo) && (
                  <div className="bg-yellow-50/50 p-2.5 rounded-xl border border-yellow-100 flex gap-2">
                    <MessageSquare size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] font-bold text-yellow-700 leading-tight italic text-left">{selectedRes.memo}</p>
                  </div>
                )}
                {hasValue(selectedRes.cast_memo) && !isEditingMemo && (
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex gap-2 shadow-inner text-left">
                    <StickyNote size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] font-bold text-blue-700 leading-tight whitespace-pre-wrap">{selectedRes.cast_memo}</p>
                  </div>
                )}
                {isEditingMemo && (
                  <div className="bg-gray-50 p-3 rounded-2xl border-2 border-pink-200 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <textarea value={memoDraft} onChange={(e) => setMemoDraft(e.target.value)} placeholder="メモを入力..." className="w-full h-24 bg-white rounded-xl p-3 text-[16px] font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner" autoFocus />
                    <button onClick={handleSaveMemo} className="w-full h-11 bg-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-black text-[14px] shadow-md active:scale-95 transition-all"><Save size={18} /> 保存する</button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-300 pt-1">
                <UserCheck size={12} className="opacity-40" />Staff: <span className="text-gray-400">{selectedRes.staff_name || '---'}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
              {!isEditingMemo && (
                <button onClick={() => setIsEditingMemo(true)} className="w-full h-12 rounded-xl bg-white border-2 border-pink-100 text-pink-500 flex items-center justify-center gap-2 font-black text-[14px] active:bg-pink-50 transition-all shadow-sm">
                  <Edit3 size={18} /> キャストメモを残す
                </button>
              )}
              <button onClick={() => alert("OP計算君起動")} className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100 active:scale-95 transition-all">
                <Calculator size={20} /> OP計算君
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className={`w-full h-10 rounded-xl text-gray-400 flex items-center justify-center gap-2 font-bold text-[12px] active:bg-rose-50 transition-all ${isDeleting ? 'opacity-50' : ''}`}>
                <Trash2 size={14} /> {isDeleting ? '消去中...' : '予約を取り消す'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}