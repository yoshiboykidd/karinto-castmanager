'use client';

import { Home, CircleDollarSign, UserRound, LogOut } from 'lucide-react';

// ★ここで pathname: string を定義して「受け取りOK」にする
type Props = {
  pathname: string; 
  onHome: () => void;
  onSalary: () => void;
  onProfile: () => void;
  onLogout: () => void;
};

export default function FixedFooter({ pathname, onHome, onSalary, onProfile, onLogout }: Props) {
  // pathname が null の場合の安全策
  const currentPath = pathname || '';
  
  const isHome = currentPath === '/';
  const isSalary = currentPath === '/salary';
  const isProfile = currentPath === '/mypage';

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-pink-100 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-[60px] pb-2">
        
        {/* ホーム */}
        <button onClick={onHome} className="flex flex-col items-center gap-1 w-12 group">
          <Home className={`w-6 h-6 transition-colors ${isHome ? 'text-pink-500 fill-pink-50' : 'text-gray-300 group-hover:text-pink-300'}`} />
          <span className={`text-[9px] font-bold ${isHome ? 'text-pink-500' : 'text-gray-300'}`}>HOME</span>
        </button>

        {/* 給与 */}
        <button onClick={onSalary} className="flex flex-col items-center gap-1 w-12 group">
          <CircleDollarSign className={`w-6 h-6 transition-colors ${isSalary ? 'text-pink-500 fill-pink-50' : 'text-gray-300 group-hover:text-pink-300'}`} />
          <span className={`text-[9px] font-bold ${isSalary ? 'text-pink-500' : 'text-gray-300'}`}>SALARY</span>
        </button>

        {/* マイページ */}
        <button onClick={onProfile} className="flex flex-col items-center gap-1 w-12 group">
          <UserRound className={`w-6 h-6 transition-colors ${isProfile ? 'text-pink-500 fill-pink-50' : 'text-gray-300 group-hover:text-pink-300'}`} />
          <span className={`text-[9px] font-bold ${isProfile ? 'text-pink-500' : 'text-gray-300'}`}>MY</span>
        </button>

        {/* ログアウト */}
        <button onClick={onLogout} className="flex flex-col items-center gap-1 w-12 group">
          <LogOut className="w-6 h-6 text-gray-300 group-hover:text-red-400 transition-colors" />
          <span className="text-[9px] font-bold text-gray-300 group-hover:text-red-400">EXIT</span>
        </button>

      </div>
    </footer>
  );
}