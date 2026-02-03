import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
// 波線の原因だったアイコン名を Lucide の正式名称に修正
import { Edit3, Star, Sparkles, JapaneseYen } from 'lucide-react';

export default function DailyDetail({ 
  date, 
  dayNum, 
  shift, 
  editReward, 
  setEditReward, 
  onSave, 
  isEditable 
}: any) {
  
  const handleChange = (field: string, value: string) => {
    setEditReward({ ...editReward, [field]: value });
  };

  return (
    <section className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 mt-2">
      {/* 日付ヘッダー：v3.0.0のデザインに準拠 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-slate-700 tracking-tighter">
          {format(date, 'M / d', { locale: ja })}
          <span className="text-xs ml-2 text-slate-300 font-bold uppercase tracking-widest">{format(date, 'eeee', { locale: ja })}</span>
        </h3>
        {shift?.status === 'official' && (
          <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 text-pink-500 text-[10px] font-black tracking-widest uppercase shadow-sm shadow-pink-50">
            <Sparkles size={10} /> <span>Confirmed</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* シフト表示：サクラピンクの柔らかな背景 */}
        <div className="bg-[#FFF5F8] p-5 rounded-[24px] border border-pink-50">
          <p className="text-[10px] font-black text-pink-300 mb-1 uppercase tracking-widest">Shift Time</p>
          <p className="text-2xl font-black text-slate-700">
            {shift?.status === 'official' ? `${shift.start_time} - ${shift.end_time}` : 'NO SCHEDULE'}
          </p>
        </div>

        {isEditable ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2 px-1">
              <Edit3 className="w-4 h-4 text-pink-300" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Results</p>
            </div>

            {/* 入力欄：デザインを壊さないよう、シンプルで丸みの強いスタイルに固定 */}
            <div className="space-y-3">
              {[
                { label: 'フリー本数', key: 'free_count' },
                { label: '初指名本数', key: 'first_nomination_count' },
                { label: '本指名本数', key: 'nomination_count' },
                { label: '本日の報酬 (¥)', key: 'reward_amount', highlight: true },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between px-4 py-3 bg-slate-50/50 rounded-[20px] border border-transparent focus-within:border-pink-200 focus-within:bg-white transition-all">
                  <p className="text-xs font-black text-slate-500">{item.label}</p>
                  <input 
                    type="number" 
                    value={editReward?.[item.key] || ''}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    placeholder="0"
                    className={`w-24 text-right text-lg font-black outline-none bg-transparent ${item.highlight ? 'text-pink-500' : 'text-slate-700'}`}
                  />
                </div>
              ))}
            </div>

            {/* 保存ボタン：サクラピンクのグラデーション */}
            <button 
              onClick={onSave}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-400 py-4 rounded-[24px] text-white font-black text-lg shadow-lg shadow-pink-100 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Star size={18} fill="currentColor" />
              実績を保存する
            </button>
          </div>
        ) : (
          <div className="py-10 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-100">
            <JapaneseYen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">実績入力は当日のみ可能です</p>
          </div>
        )}
      </div>
    </section>
  );
}