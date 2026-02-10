'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, BarChart2, User, LogOut } from 'lucide-react';

interface FixedFooterProps {
  pathname: string;
  onLogout?: () => void;
}

export default function FixedFooter({ pathname, onLogout }: FixedFooterProps) {
  const router = useRouter();
  // 📍 押された瞬間のパスを保持するステート
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // 実際のページ遷移が終わったら pending 状態をクリア
  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  const menuItems = [
    { label: 'ホーム', icon: Home, path: '/', action: () => { setPendingPath('/'); router.push('/'); } },
    { label: '実績', icon: BarChart2, path: '/salary', action: () => { setPendingPath('/salary'); router.push('/salary'); } },
    { label: 'マイページ', icon: User, path: '/mypage', action: () => { setPendingPath('/mypage'); router.push('/mypage'); } },
    { label: 'ログアウト', icon: LogOut, path: null, action: onLogout },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-gradient-to-t from-white via-white/95 to-transparent">
      <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-pink-100 rounded-[32px] shadow-[0_8px_32px_rgba(255,182,193,0.15)] px-6 py-3">
        <ul className="flex justify-between items-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // 📍 現在のページ、または「今押したボタン」であればアクティブ色にする
            const isActive = pathname === item.path || pendingPath === item.path;
            
            return (
              <li key={item.label}>
                <button
                  onClick={item.action}
                  className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                    isActive ? 'scale-110' : 'opacity-40 active:scale-90'
                  }`}
                >
                  <div className={`p-2 rounded-2xl transition-colors duration-200 ${
                    isActive ? 'bg-pink-400 text-white shadow-lg shadow-pink-200' : 'text-gray-400'
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-black transition-colors duration-200 ${
                    isActive ? 'text-pink-500' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}