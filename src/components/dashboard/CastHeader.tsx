'use client';

import { useState, useEffect } from 'react';
import { LogOut, RefreshCw, ShieldAlert } from 'lucide-react'; // アイコン用

type CastHeaderProps = {
  shopName: string;
  syncTime: string;
  displayName: string;
  version?: string; // 使わないが互換性のため残す
};

export default function CastHeader({ shopName, syncTime, displayName }: CastHeaderProps) {
  const [seasonalEmoji, setSeasonalEmoji] = useState('☃️');
  const [isPanicMode, setIsPanicMode] = useState(false);

  // 季節の絵文字判定ロジック
  useEffect(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) setSeasonalEmoji('🌸');      // 春
    else if (month >= 6 && month <= 8) setSeasonalEmoji('🌻'); // 夏
    else if (month >= 9 && month <= 11) setSeasonalEmoji('🍁'); // 秋
    else setSeasonalEmoji('☃️');                               // 冬
  }, []);

  return (
    <>
      {/* ★ 緊急脱出用オーバーレイ（パニックモード） */}
      {isPanicMode && (
        <div 
          className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center cursor-pointer"
          onDoubleClick={() => setIsPanicMode(false)} // ダブルタップで復帰
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mb-4"></div>
          <p className="text-gray-400 font-bold text-sm tracking-widest animate-pulse">CONNECTING...</p>
          <p className="absolute bottom-10 text-[10px] text-gray-300">Double tap to resume</p>
        </div>
      )}

      <header className="bg-white px-5 pt-8 pb-5 rounded-b-[40px] shadow-sm border-b border-pink-50 relative">
        <div className="flex justify-between items-start">
          
          {/* --- 左サイド --- */}
          <div className="flex flex-col space-y-1">
            {/* アプリタイトル */}
            <p className="text-[10px] font-black text-pink-300/80 uppercase tracking-[0.2em] leading-none">
              - CastManager -
            </p>
            
            {/* 店名（「店」は付けない） */}
            <p className="text-[12px] font-bold text-gray-400 pl-0.5">
              {shopName || '店舗未設定'}
            </p>

            {/* 名前エリア */}
            <div className="pt-1">
              <h1 className="text-[26px] font-black text-gray-800 leading-tight flex items-center gap-1">
                {displayName || 'キャスト'}
                <span className="text-[24px] filter drop-shadow-sm">{seasonalEmoji}</span>
              </h1>
              <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1 pl-0.5 mt-0.5">
                お疲れ様です <span className="text-[14px]">🍵</span>
              </p>
            </div>
          </div>

          {/* --- 右サイド --- */}
          <div className="flex flex-col items-end space-y-3 pt-1">
            
            {/* HP同期時刻（サイズアップ） */}
            {syncTime && (
              <div className="bg-green-50/80 px-3 py-1.5 rounded-xl border border-green-100 flex items-center gap-2 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-black text-green-600/50 uppercase tracking-tighter mb-0.5">HP SYNC</span>
                  <span className="text-[13px] font-black text-green-600 tracking-tight">{syncTime}</span>
                </div>
              </div>
            )}

            {/* 緊急脱出ボタン（ステルスボタン） */}
            <button
              onClick={() => setIsPanicMode(true)}
              className="group flex items-center gap-1.5 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-400 px-3 py-2 rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] font-black tracking-widest group-hover:block hidden">EXIT</span>
            </button>
            
          </div>
        </div>
      </header>
    </>
  );
}