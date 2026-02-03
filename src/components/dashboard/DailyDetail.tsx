'use client';

import { format, isAfter, startOfToday } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
  date: Date;
  dayNum: number;
  dayOfficial: any;    // HPに枠がある場合（is_official_pre_exist === true）
  dayRequested: any;   // キャストが申請中の場合（status === 'requested'）
  editReward: any;
  setEditReward: (val: any) => void;
  onSave: () => void;
  activeTab: string;
}

export default function DailyDetail({
  date, dayNum, dayOfficial, dayRequested, editReward, setEditReward, onSave 
}: Props) {
  const isFuture = isAfter(date, startOfToday());
  const dateStr = format(date, 'M月d日(E)', { locale: ja });

  return (
    <div className="bg-white rounded-[32px] p-6 border border-pink-50 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ヘッダー：日付 */}
      <div className="flex justify-between items-center border-b border-pink-50 pb-3">
        <h3 className="text-xl font-black text-gray-700">
          <span className="text-pink-500 mr-2">{dayNum}</span>
          <span className="text-sm font-bold text-gray-400">{dateStr}</span>
        </h3>
        {isFuture ? (
          <span className="px-3 py-1 bg-purple-50 text-purple-500 text-[10px] font-black rounded-full border border-purple-100 uppercase tracking-widest">Schedule</span>
        ) : (
          <span className="px-3 py-1 bg-pink-50 text-pink-500 text-[10px] font-black rounded-full border border-pink-100 uppercase tracking-widest">Result</span>
        )}
      </div>

      {/* --- 明日以降の表示（公式 vs 申請） --- */}
      {isFuture ? (
        <div className="space-y-3">
          {/* 公式HPの枠 */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
            <div className="text-[9px] font-black text-gray-400 mb-1 flex items-center">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-1.5"></span>公式HPの掲載
            </div>
            <div className="text-lg font-black text-gray-600">
              {dayOfficial ? `${dayOfficial.start_time} 〜 ${dayOfficial.end_time}` : '掲載なし'}
            </div>
            {dayOfficial?.is_official === false && (
              <div className="absolute right-3 top-3 text-[8px] font-black bg-pink-500 text-white px-1.5 py-0.5 rounded italic">UPDATING...</div>
            )}
          </div>

          {/* キャストの申請中データ */}
          {dayRequested && (
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-[9px] font-black text-purple-400 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5"></span>あなたの申請
              </div>
              <div className="text-lg font-black text-purple-600">
                {dayRequested.start_time} 〜 {dayRequested.end_time}
              </div>
              <p className="text-[8px] text-purple-400 mt-1">※反映まで5分〜10分程度かかります</p>
            </div>
          )}
        </div>
      ) : (
        /* --- 今日以前の表示（実績入力） --- */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 ml-2">フリー数</label>
              <input type="number" value={editReward.f} onChange={e => setEditReward({...editReward, f: e.target.value})} className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-2xl p-3 text-center font-black text-pink-600 focus:ring-2 focus:ring-pink-300 outline-none" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 ml-2">本指名</label>
              <input type="number" value={editReward.main} onChange={e => setEditReward({...editReward, main: e.target.value})} className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-2xl p-3 text-center font-black text-pink-600 focus:ring-2 focus:ring-pink-300 outline-none" placeholder="0" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 ml-2">本日の報酬合計 (¥)</label>
            <input type="number" value={editReward.amount} onChange={e => setEditReward({...editReward, amount: e.target.value})} className="w-full bg-pink-50 border-2 border-pink-200 rounded-2xl p-4 text-center text-2xl font-black text-pink-600 focus:ring-2 focus:ring-pink-400 outline-none" placeholder="0" />
          </div>

          <button onClick={onSave} className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white py-4 rounded-2xl font-black shadow-lg shadow-pink-200 active:scale-95 transition-all">
            実績を保存する 💰
          </button>
        </div>
      )}
    </div>
  );
}