import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Edit3, hoshi, Sparkles, YenSign } from 'lucide-react'; // アイコンはお好みで

export default function DailyDetail({ 
  date, 
  dayNum, 
  shift, 
  editReward, 
  setEditReward, 
  onSave, 
  isEditable 
}: any) {
  
  // 入力値の変更ハンドラー
  const handleChange = (field: string, value: string) => {
    setEditReward({ ...editReward, [field]: value });
  };

  return (
    <section className="bg-white rounded-[32px] p-6 border-2 border-pink-100 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-700">
            {format(date, 'M/d', { locale: ja })}
            <span className="text-sm ml-1 text-slate-400">({format(date, 'E', { locale: ja })})</span>
          </h3>
        </div>
        {shift?.status === 'official' ? (
          <span className="bg-pink-500 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest shadow-lg shadow-pink-100">Official</span>
        ) : (
          <span className="bg-slate-100 text-slate-400 text-[10px] px-3 py-1 rounded-full font-black tracking-widest">Day Off</span>
        )}
      </div>

      <div className="space-y-6">
        {/* 現在のシフト表示 */}
        <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
          <p className="text-[10px] font-bold text-pink-400 mb-1 uppercase tracking-tighter">Current Shift</p>
          <p className="text-2xl font-black text-slate-700">
            {shift?.status === 'official' ? `${shift.start_time} - ${shift.end_time}` : 'お休み'}
          </p>
        </div>

        {/* ★実績入力エリア */}
        {isEditable ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Edit3 className="w-4 h-4 text-pink-400" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Achievement Entry</p>
            </div>

            {/* 数値入力グリッド */}
            <div className="grid grid-cols-2 gap-3">
              {/* フリー本数 */}
              <div className="bg-white border-2 border-slate-100 p-3 rounded-2xl focus-within:border-pink-300 transition-colors">
                <p className="text-[10px] font-bold text-slate-400 mb-1">フリー本数</p>
                <input 
                  type="number" 
                  value={editReward?.free_count || ''}
                  onChange={(e) => handleChange('free_count', e.target.value)}
                  placeholder="0"
                  className="w-full text-xl font-black text-slate-700 outline-none bg-transparent"
                />
              </div>
              {/* 初指名本数 */}
              <div className="bg-white border-2 border-slate-100 p-3 rounded-2xl focus-within:border-pink-300 transition-colors">
                <p className="text-[10px] font-bold text-slate-400 mb-1">初指名本数</p>
                <input 
                  type="number" 
                  value={editReward?.first_nomination_count || ''}
                  onChange={(e) => handleChange('first_nomination_count', e.target.value)}
                  placeholder="0"
                  className="w-full text-xl font-black text-slate-700 outline-none bg-transparent"
                />
              </div>
              {/* 本指名本数 */}
              <div className="bg-white border-2 border-slate-100 p-3 rounded-2xl focus-within:border-pink-300 transition-colors">
                <p className="text-[10px] font-bold text-slate-400 mb-1">本指名本数</p>
                <input 
                  type="number" 
                  value={editReward?.nomination_count || ''}
                  onChange={(e) => handleChange('nomination_count', e.target.value)}
                  placeholder="0"
                  className="w-full text-xl font-black text-slate-700 outline-none bg-transparent"
                />
              </div>
              {/* 報酬額 */}
              <div className="bg-white border-2 border-pink-200 p-3 rounded-2xl focus-within:border-pink-400 transition-colors">
                <p className="text-[10px] font-bold text-pink-400 mb-1">報酬額 (¥)</p>
                <input 
                  type="number" 
                  value={editReward?.reward_amount || ''}
                  onChange={(e) => handleChange('reward_amount', e.target.value)}
                  placeholder="0"
                  className="w-full text-xl font-black text-pink-500 outline-none bg-transparent placeholder:text-pink-100"
                />
              </div>
            </div>

            {/* 保存ボタン */}
            <button 
              onClick={onSave}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-400 py-4 rounded-2xl text-white font-black text-lg shadow-lg shadow-pink-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              実績を保存する
            </button>
          </div>
        ) : (
          <div className="py-10 text-center space-y-2">
            <div className="inline-block p-4 rounded-full bg-slate-50 text-slate-200">
              <YenSign className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-300">本日の実績はまだ入力できません</p>
          </div>
        )}
      </div>
    </section>
  );
}