import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function DailyDetail({ date, dayNum, shift, editReward, setEditReward, onSave, isEditable }: any) {
  return (
    <section className="bg-white rounded-[32px] p-6 border-2 border-pink-100 shadow-sm animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-700">{format(date, 'M/d(E)', { locale: ja })}</h3>
        {shift?.status === 'official' ? (
          <span className="bg-pink-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Confirmed</span>
        ) : shift?.status === 'requested' ? (
          <span className="bg-purple-100 text-purple-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Pending</span>
        ) : (
          <span className="bg-slate-100 text-slate-400 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Off</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-400 mb-1">現在のシフト状況</p>
          {shift?.status === 'official' ? (
            <p className="text-2xl font-black text-slate-700">{shift.start_time} - {shift.end_time}</p>
          ) : shift?.status === 'requested' ? (
            <div>
              <p className="text-xl font-black text-purple-600">{shift.main_request}</p>
              <p className="text-[9px] text-purple-400 font-bold mt-1">※店舗のHP反映を待っています</p>
            </div>
          ) : (
            <p className="text-slate-300 font-bold italic">予定なし</p>
          )}
        </div>

        {/* 実績入力エリア（isEditableがtrueの場合のみ） */}
        {isEditable && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-widest">Achievement Entry</p>
            {/* ここに入力フォームが続く */}
            <button onClick={onSave} className="w-full bg-pink-500 py-3 rounded-2xl text-white font-black shadow-lg shadow-pink-100">保存する</button>
          </div>
        )}
      </div>
    </section>
  );
}