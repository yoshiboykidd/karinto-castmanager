'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, DollarSign, LogOut, Megaphone } from 'lucide-react';

// --- 1. 型定義と特定日の設定 (波線エラーを解消) ---
const SPECIFIC_DAYS: Record<number, string> = { 
  10: "かりんとの日", 
  11: "添い寝の日", 
  22: "添い寝の日" 
};

export default function CastDashboard() {
  const [activeTab, setActiveTab] = useState<'achievement' | 'request'>('achievement');
  // selectedDate.getDate() を安全に使用するための状態管理
  const [selectedDate] = useState(new Date());
  const currentDay = selectedDate.getDate();
  
  // 仮のキャスト・店舗データ (Supabase取得値を想定)
  const cast = {
    display_name: "つき",
    shop_name: "池袋西口",
    sync_time: "12:57"
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800">
      
      {/* 1. ヘッダー (修正：名前とさんのバランス) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100 px-4 py-3 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] text-pink-400 font-bold tracking-wider uppercase">
            {cast.shop_name}店
          </span>
          <span className="text-[9px] text-gray-400">Sync: {cast.sync_time}</span>
        </div>
        <div className="flex items-baseline font-bold text-gray-700">
          <span className="text-lg">{cast.display_name}</span>
          <span className="text-[10px] ml-0.5 font-normal text-gray-500">さん</span>
        </div>
      </header>

      <main className="max-w-md mx-auto space-y-4 p-4">

        {/* 2. 実績or申請切り替えタブ */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('achievement')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'achievement' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500'
            }`}
          >
            実績入力
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'request' ? 'bg-white text-purple-500 shadow-sm' : 'text-gray-500'
            }`}
          >
            シフト申請
          </button>
        </div>

        {/* 3. 実績合計 (修正：崩れない3カラム固定バッジ) */}
        {activeTab === 'achievement' && (
          <div className="grid grid-cols-3 gap-0 px-1 py-3 bg-white rounded-2xl shadow-sm border border-pink-50">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-400 mb-1 font-medium">今月の報酬</span>
              <div className="flex items-baseline">
                <span className="text-xl font-black text-pink-500 leading-none">128,500</span>
                <span className="text-[9px] ml-0.5 text-gray-400 font-bold">円</span>
              </div>
            </div>
            <div className="flex flex-col items-center border-x border-pink-50">
              <span className="text-[9px] text-gray-400 mb-1 font-medium">出勤日数</span>
              <div className="flex items-baseline">
                <span className="text-xl font-black text-gray-700 leading-none">12</span>
                <span className="text-[9px] ml-0.5 text-gray-400 font-bold">日</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-400 mb-1 font-medium">累計稼働</span>
              <div className="flex items-baseline">
                <span className="text-xl font-black text-gray-700 leading-none">64.5</span>
                <span className="text-[9px] ml-0.5 text-gray-400 font-bold">h</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. カレンダー (マーカー仕様固定) */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-black text-gray-700 text-sm">2026.02</h3>
            <div className="text-[9px] text-gray-400 flex gap-2">
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full border border-yellow-400"></span>特定日</span>
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>確定</span>
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full border border-purple-400 border-dashed"></span>申請</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-3 text-center">
            {['日','月','火','水','木','金','土'].map(d => (
              <span key={d} className="text-[10px] font-bold text-gray-300">{d}</span>
            ))}
            {[...Array(28)].map((_, i) => {
              const day = i + 1;
              const isEvent = SPECIFIC_DAYS[day];
              return (
                <div key={day} className="relative py-2 flex flex-col items-center justify-center cursor-pointer">
                  <span className={`text-sm font-bold z-10 ${day === 3 ? 'text-pink-500' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {isEvent && <div className="absolute inset-0 m-auto w-8 h-8 border-2 border-yellow-300 rounded-full" />}
                  {day === 3 && <div className="absolute inset-0 m-auto w-7 h-7 bg-pink-50 border border-pink-400 rounded-full" />}
                  {day === 15 && <div className="absolute inset-0 m-auto w-7 h-7 border border-purple-400 border-dashed rounded-full" />}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. 日付詳細 (波線エラー修正箇所) */}
        <section className={`rounded-2xl p-5 shadow-sm border transition-colors ${
          SPECIFIC_DAYS[currentDay] ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400">2026.02.{currentDay} (火)</span>
              <h4 className="text-lg font-black text-gray-800">
                {SPECIFIC_DAYS[currentDay] || "通常稼働"}
              </h4>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold text-white ${activeTab === 'achievement' ? 'bg-pink-500' : 'bg-purple-500'}`}>
              {activeTab === 'achievement' ? '実績入力' : 'シフト申請'}
            </span>
          </div>

          {activeTab === 'achievement' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 ml-1">本指名本数</label>
                  <input type="number" className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-pink-200" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 ml-1">報酬額</label>
                  <input type="number" className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-pink-200" placeholder="¥" />
                </div>
              </div>
              <button className="w-full bg-pink-500 text-white font-black py-3 rounded-xl shadow-lg shadow-pink-100 active:scale-95 transition-transform">
                実績を保存する
              </button>
            </div>
          ) : (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
              <p className="text-sm text-purple-600 font-bold italic">タップして申請時間を選択</p>
            </div>
          )}
        </section>

        {/* 6. 申請リスト */}
        {activeTab === 'request' && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
            <h5 className="text-[10px] font-bold text-purple-400 mb-3 uppercase tracking-widest">Selected List</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-lg border border-purple-50">
                <span className="text-sm font-bold text-gray-600">02.15 (日)</span>
                <span className="text-sm font-black text-purple-600">11:00 - 22:00</span>
              </div>
            </div>
          </section>
        )}

        {/* 7. NEWS */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Megaphone size={16} className="text-pink-400" />
            <h3 className="font-black text-gray-700 text-sm">NEWS</h3>
          </div>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-bold text-pink-400 bg-pink-50 px-2 py-0.5 rounded">{i === 1 ? "重要" : "通知"}</span>
                  <span className="text-[9px] text-gray-400 font-medium">2026.02.01</span>
                </div>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  {i === 1 ? "【全店】2月度の特定日およびイベントスケジュールについて" : "システムメンテナンスのお知らせ（2/15）"}
                </p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* 8. 固定フッター */}
      <nav className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
        <button className="flex flex-col items-center gap-1 text-pink-500">
          <CalendarIcon size={20} />
          <span className="text-[9px] font-black">ホーム</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-300">
          <DollarSign size={20} />
          <span className="text-[9px] font-black">月間成績</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-300">
          <LogOut size={20} />
          <span className="text-[9px] font-black">終了</span>
        </button>
      </nav>

    </div>
  );
}