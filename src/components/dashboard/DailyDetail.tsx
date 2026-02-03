import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Edit3, Star, Sparkles, JapaneseYen } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, editReward, setEditReward, onSave, isEditable }: any) {
  const handleChange = (field: string, value: string) => {
    setEditReward({ ...editReward, [field]: value });
  };

  return (
    <section className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 mt-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-slate-700 tracking-tighter">
          {format(date, 'M / d', { locale: ja })}
          <span className="text-xs ml-2 text-slate-300 font-bold uppercase">{format(date, 'eeee', { locale: ja })}</span>
        </h3>
        {shift?.status === 'official' ? (
          <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
            <Sparkles size={10} className="text-pink-400" />
            <span className="text-pink-500 text-[10px] font-black tracking-widest uppercase">Confirmed</span>
          </div>
        ) : (
          <span className="bg-slate-50 text-slate-300 text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase">Off Day</span>
        )}
      </div>

      <div className="space-y-5">
        {/* 現在のシフト：パステルピンクの背景 */}
        <div className="bg-[#FFF5F8] p-4 rounded-3xl border border-pink-50">
          <p className="text-[10px] font-black text-pink-300 mb-1 uppercase tracking-widest">Shift Schedule</p>
          <p className="text-2xl font-black text-slate-700">
            {shift?.status === 'official' ? `${shift.start_time} - ${shift.end_time}` : 'NO SCHEDULE'}
          </p>
        </div>

        {isEditable ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Edit3 className="w-4 h-4 text-pink-300" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Result Entry</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'フリー', key: 'free_count' },
                { label: '初指名', key: 'first_nomination_count' },
                { label: '本指名', key: 'nomination_count' },
                { label: '報酬 (¥)', key: 'reward_amount', highlight: true },
              ].map((item) => (
                <div key={item.key} className={`p-3 rounded-2xl border-2 transition-all ${item.highlight ? 'border-pink-100 bg-pink-50/20' : 'border-slate-50 bg-slate-50/30'} focus-within:border-pink-300`}>
                  <p className="text-[9px] font-black text-slate-400 mb-1">{item.label}</p>
                  <input 
                    type="number" 
                    value={editReward?.[item.key] || ''}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    placeholder="0"
                    className="w-full text-xl font-black text-slate-700 outline-none bg-transparent placeholder:text-slate-200"
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={onSave}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-400 py-4 rounded-[24px] text-white font-black text-lg shadow-lg shadow-pink-100 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Star size={18} fill="currentColor" />
              実績を保存する
            </button>
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-100">
            <JapaneseYen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">実績入力は当日のみ可能です</p>
          </div>
        )}
      </div>
    </section>
  );
}