'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type DailyDetailProps = {
  date: Date | undefined;
  dayNum: number | undefined;
  dayOfficial: any;
  dayRequested: any;
  editReward: { f: string; first: string; main: string; amount: string };
  setEditReward: (val: any) => void;
  onSave: () => void;
  activeTab: 'achievement' | 'request';
};

export default function DailyDetail({
  date,
  dayNum,
  dayOfficial,
  dayRequested,
  editReward,
  setEditReward,
  onSave,
  activeTab
}: DailyDetailProps) {
  if (!date) return null;

  // 特定日の判定
  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  return (
    <section className={`rounded-[32px] border shadow-xl p-5 flex flex-col space-y-1 transition-all duration-300
      ${isKarin ? 'bg-orange-50 border-orange-200' : 
        isSoine ? 'bg-yellow-50 border-yellow-200' : 
        'bg-white border-pink-100'}`}
    >
      {/* 特定日ラベル */}
      {(isKarin || isSoine) && (
        <div className={`-mt-2 mb-2 py-1.5 px-4 rounded-full text-center font-black text-[12px] tracking-[0.2em] shadow-sm
          ${isKarin ? 'bg-orange-400 text-white' : 'bg-yellow-400 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      {/* 日付とステータス表示 */}
      <div className="flex items-center justify-between px-1 gap-2">
        <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline whitespace-nowrap">
          {format(date, 'M/d')}
          <span className="text-lg ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
        
        <div className="flex items-center gap-1 flex-nowrap shrink-0 justify-end">
          {(!dayOfficial || dayOfficial.start_time === 'OFF') && !dayRequested ? (
            <span className="whitespace-nowrap text-[12px] font-black text-gray-400 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 leading-none">お休み</span>
          ) : dayOfficial ? (
            <>
              <span className="whitespace-nowrap text-[12px] font-black text-blue-500 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 leading-none">確定シフト</span>
              <span className="whitespace-nowrap text-[20px] font-black text-pink-500 leading-none ml-1">{dayOfficial.start_time}〜{dayOfficial.end_time}</span>
            </>
          ) : dayRequested ? (
            <>
              <span className="whitespace-nowrap text-[12px] font-black text-purple-500 bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-100 leading-none">申請中</span>
              <span className="whitespace-nowrap text-[20px] font-black text-purple-400 leading-none ml-1">{dayRequested.start_time === 'OFF' ? 'お休み' : `${dayRequested.start_time}〜${dayRequested.end_time}`}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* 入力フォーム部分 */}
      {dayOfficial && dayOfficial.start_time !== 'OFF' ? (
        <>
          <div className="flex flex-col space-y-0.5 pt-1 text-center font-black text-gray-400 text-[11px] uppercase tracking-widest">
            <div className="grid grid-cols-3 gap-2 px-1"><span>フリー</span><span>初指名</span><span>本指名</span></div>
            <div className="grid grid-cols-3 gap-2">
              {(['f', 'first', 'main'] as const).map((key) => (
                <input
                  key={key}
                  type="number"
                  inputMode="numeric"
                  value={editReward[key]}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditReward({ ...editReward, [key]: e.target.value })}
                  className={`w-full text-center py-2 bg-white rounded-xl font-black text-3xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none transition-all ${editReward[key] === '' ? 'text-gray-200' : 'text-pink-500'}`}
                />
              ))}
            </div>
          </div>
          <div className="bg-pink-50/40 p-3 rounded-[22px] border border-pink-100 flex items-center justify-between shadow-inner">
            <label className="text-[13px] font-black text-gray-900 uppercase">報酬合計</label>
            <div className="flex items-center text-pink-500">
              <span className="text-2xl font-black mr-1 opacity-40 translate-y-[1px]">¥</span>
              <input
                type="text"
                inputMode="numeric"
                value={editReward.amount !== '' ? Number(editReward.amount).toLocaleString() : ''}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value.replace(/,/g, '');
                  if (/^\d*$/.test(v)) setEditReward({ ...editReward, amount: v });
                }}
                className={`w-40 text-right bg-transparent font-black text-[32px] border-none focus:ring-0 caret-pink-500 tracking-tighter ${editReward.amount === '' ? 'text-gray-200' : 'text-pink-500'}`}
              />
            </div>
          </div>
          <button
            onClick={onSave}
            className="w-full bg-pink-500 text-white font-black py-4 rounded-[20px] text-lg shadow-lg active:scale-95 transition-all mt-1"
          >
            実績を保存 💾
          </button>
        </>
      ) : (
        <div className="py-8 text-center text-gray-300 font-bold italic text-xs">
          {dayRequested ? "確定をお待ちください⛄️" : "お休みです☕️"}
        </div>
      )}
    </section>
  );
}