'use client';

import { format } from 'date-fns';

type Props = {
  shopName: string;
  syncTime?: string | null;
  displayName?: string;
  version: string;
  transparent?: boolean; // ★ここを追加！
};

export default function CastHeader({ 
  shopName, 
  syncTime, 
  displayName, 
  version, 
  transparent = false // ★ここも追加（デフォルトはfalse）
}: Props) {
  return (
    <header className={`px-6 py-5 rounded-b-[40px] flex items-center justify-between relative overflow-hidden transition-colors duration-500
      ${transparent 
        ? 'bg-transparent text-white border-none shadow-none' // 透明モード（親の色が透ける）
        : 'bg-white text-gray-800 shadow-sm'                 // 通常モード（白背景）
      }
    `}>
      {/* 左側：店名と更新時間 */}
      <div>
        <h1 className="text-lg font-black tracking-tighter leading-none mb-1">
          {shopName}
        </h1>
        <div className="flex items-center gap-2 opacity-80">
          <span className="text-[10px] font-bold tracking-widest uppercase">
            LAST SYNC
          </span>
          <span className="text-[10px] font-mono font-bold bg-black/10 px-1.5 py-0.5 rounded">
            {syncTime ? format(new Date(syncTime), 'HH:mm') : '--:--'}
          </span>
        </div>
      </div>

      {/* 右側：名前とバージョン */}
      <div className="text-right">
        <p className="text-sm font-black tracking-tight leading-none mb-1">
          {displayName || 'GUEST'}
        </p>
        <span className="text-[10px] font-bold opacity-60 tracking-widest">
          {version}
        </span>
      </div>
    </header>
  );
}