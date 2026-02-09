'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type DailyDetailProps = {
  date: Date;
  dayNum: number;
  shift: any;        // HPからスクレイピングした出勤データ
  reservations: any[]; // メールから解析した予約データ
};

export default function DailyDetail({
  date,
  dayNum,
  shift,
  reservations = []
}: DailyDetailProps) {
  if (!date) return null;

  // 特定日判定（デザイン維持）
  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  // 指名ラベル変換ロジック
  const getNomLabel = (type: string) => {
    if (type?.includes('本')) return '<本>';
    if (type?.includes('初')) return '<初>';
    return '<F>';
  };

  return (
    <section className="relative overflow-hidden rounded-[32px] border shadow-xl p-4 pt-6 flex flex-col space-y-3 bg-white border-pink-100 transition-all duration-300">
      
      {/* 特定日バッジ */}
      {(isKarin || isSoine) && (
        <div className={`absolute top-0 left-0 right-0 py-0.5 text-center font-black text-[10px] tracking-[0.2em] shadow-sm z-20
          ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      {/* 1行目：日付ヘッダー */}
      <div className="flex items-center justify-between px-1 h-7 mt-0.5">
        <h3 className="text-xl font-black text-gray-800 tracking-tight leading-none flex items-baseline shrink-0">
          {format(date, 'M/d')}
          <span className="text-base ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
        <span className="text-[10px] font-black text-pink-200 italic uppercase tracking-widest">
          Schedule Details
        </span>
      </div>

      {/* 2行目：HP上の出勤予定時間（閲覧のみ） */}
      <div className="flex items-center justify-between px-1 h-12 bg-pink-50/30 rounded-2xl p-3 border border-pink-50">
        {shift && shift.start_time !== 'OFF' ? (
          <>
            <span className="text-[11px] font-black px-3 py-1.5 rounded-xl bg-pink-500 text-white shadow-sm">出勤</span>
            <span className="text-[28px] font-black text-pink-500 tracking-tighter leading-none">
              {shift.start_time}〜{shift.end_time}
            </span>
          </>
        ) : (
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-[11px] font-black px-3 py-1.5 rounded-xl bg-gray-300 text-white shadow-sm">お休み</span>
            <span className="text-[10px] font-black text-gray-300 italic uppercase tracking-widest opacity-40">No Shift Scheduled</span>
          </div>
        )}
      </div>

      {/* 3行目：予約リスト（メール同期分） */}
      <div className="space-y-2 pt-2 border-t border-gray-100/50">
        <h4 className="text-[10px] font-black text-gray-400 px-1 italic uppercase tracking-wider">🕒 お仕事予約</h4>
        
        {reservations.length > 0 ? (
          reservations.map((res, idx) => (
            <details key={idx} className="group bg-white border border-pink-100 rounded-2xl shadow-sm overflow-hidden">
              <summary className="list-none p-4 flex items-center justify-between cursor-pointer active:bg-pink-50">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-pink-400 leading-none mb-1">
                    {res.start_time.slice(0, 5)}〜{res.end_time.slice(0, 5)}
                  </span>
                  <span className="text-[14px] font-bold text-gray-700 leading-tight">
                    {res.shop_label}{res.customer_name}様{getNomLabel(res.nomination_type)}{res.course_info}
                  </span>
                </div>
                <span className="text-pink-200 group-open:rotate-180 transition-transform text-[10px]">▼</span>
              </summary>

              <div className="px-4 pb-4 bg-pink-50/10 border-t border-dashed border-pink-50 pt-3 text-[11px] text-gray-600">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] text-gray-400">■ 料金合計</p>
                    <p className="text-lg font-black text-pink-500">{res.total_price}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400">■ ホテル</p>
                    <p className="font-bold">{res.location_info || '-'}</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <p className="text-[9px] text-gray-400">■ 予約詳細</p>
                    <div className="bg-white p-3 rounded-xl border border-pink-100 leading-relaxed space-y-1 shadow-inner">
                      <p>【コース】 {res.course_info}</p>
                      <p>【オプション】 {res.option_info || 'なし'}</p>
                      <p>【割引】 {res.discount_info || 'なし'}</p>
                      <p>【メモ】 {res.memo || 'なし'}</p>
                      <p className="text-[9px] text-gray-300 pt-1 border-t border-gray-50 mt-1">会員番号: {res.customer_id || '-'}</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 py-3 bg-pink-50 text-pink-400 rounded-xl font-black text-[10px] border border-pink-100">
                  🧮 OP君 (計算ツール) 準備中
                </button>
              </div>
            </details>
          ))
        ) : (
          <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
            <p className="text-[11px] font-bold text-gray-300">予約情報はありません</p>
          </div>
        )}
      </div>

    </section>
  );
}