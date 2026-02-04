'use client';

import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

type CastHeaderProps = {
  shopName: string;
  syncTime: string;
  displayName: string;
  version?: string;
};

export default function CastHeader({ shopName, syncTime, displayName }: CastHeaderProps) {
  const [seasonalEmoji, setSeasonalEmoji] = useState('☃️');
  const [isPanicMode, setIsPanicMode] = useState(false);

  useEffect(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) setSeasonalEmoji('🌸');
    else if (month >= 6 && month <= 8) setSeasonalEmoji('🌻');
    else if (month >= 9 && month <= 11) setSeasonalEmoji('🍁');
    else setSeasonalEmoji('☃️');
  }, []);

  return (
    <>
      {/* 緊急脱出用オーバーレイ */}
      {isPanicMode && (
        <div 
          className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center cursor-pointer"
          onDoubleClick={() => setIsPanicMode(false)}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mb-4"></div>
          <p className="text-gray-400 font-bold text-sm tracking-widest animate-pulse">CONNECTING...</p>
          <p className="absolute bottom-10 text-[10px] text-gray-300">Double tap to resume</p>
        </div>
      )}

      <header className="bg-white px-5 pt-8 pb-5 rounded-b-[40px] shadow-sm border-b border-pink-50 relative">
        <div className="flex justify-between items-end">
          
          {/* --- 左サイド --- */}
          <div className="flex flex-col space-y-1">
            <p className="text-[10px] font-black text-pink-300/80 uppercase tracking-[0.2em] leading-none">
              - CastManager -
            </p>
            <p className="text-[12px] font-bold text-gray-400 pl-0.5">
              {shopName || '店舗未設定'}
            </p>

            <div className="pt-1">
              <h1 className="font-black text-gray-800 leading-tight flex items-baseline">
                <span className="text-[26px]">{displayName || 'キャスト'}</span>
                <span className="text-[13px] text-gray-400 ml-1 font-bold">さん</span>
                <span className="text-[24px] ml-1 filter drop-shadow-sm -translate-y-0.5">{seasonalEmoji}</span>
              </h1>
              <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1 pl-0.5 mt-0.5">
                お疲れ様です <span className="text-[14px]">🍵</span>
              </p>
            </div>
          </div>

          {/* --- 右サイド（サイズ統一・中央寄せ） --- */}
          <div className="flex flex-col items-end space-y-2 pb-0.5">
            
            {/* HP同期時刻 */}
            {syncTime && (
              <div className="bg-green-50/80 w-[128px] h-[44px] rounded-xl border border-green-100 flex items-center justify-center gap-2 shadow-sm">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <div className="flex flex-col leading-none items-center">
                  <span className="text-[8px] font-black text-green-600/50 uppercase tracking-tighter mb-0.5">HP SYNC</span>
                  <span className="text-[13px] font-black text-green-600 tracking-tight">{syncTime}</span>
                </div>
              </div>
            )}

            {/* 緊急脱出ボタン */}
            <button
              onClick={() => setIsPanicMode(true)}
              className="bg-rose-50/80 w-[128px] h-[44px] rounded-xl border border-rose-100 flex items-center justify-center gap-2 shadow-sm hover:bg-rose-100 transition-all active:scale-95 group"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0 group-hover:rotate-12 transition-transform" />
              <div className="flex flex-col leading-none items-center">
                <span className="text-[8px] font-black text-rose-400/50 uppercase tracking-tighter mb-0.5">SECRET</span>
                <span className="text-[13px] font-black text-rose-500 tracking-widest">ESCAPE</span>
              </div>
            </button>
            
          </div>
        </div>
      </header>
    </>
  );
}