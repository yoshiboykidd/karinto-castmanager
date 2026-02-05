'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LogOut, LayoutDashboard } from 'lucide-react'; // 必要なアイコン

type AdminHeaderProps = {
  title?: string;
  shopName?: string;
};

export default function AdminHeader({ title = "管理画面", shopName }: AdminHeaderProps) {
  const router = useRouter();

  // Supabaseクライアント作成
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ログアウト処理
  const handleLogout = async () => {
    // 確認ダイアログ（誤操作防止）
    const isConfirmed = window.confirm('ログアウトしますか？');
    if (!isConfirmed) return;

    await supabase.auth.signOut();
    router.push('/login'); // ログイン画面へ戻す
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      
      {/* 左側：タイトルエリア */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-gray-800">
          <LayoutDashboard className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        {shopName && (
          <p className="text-xs text-gray-400 font-bold ml-7">{shopName}</p>
        )}
      </div>

      {/* 右側：ログアウトボタン */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-all active:scale-95 text-sm font-bold"
      >
        <LogOut className="w-4 h-4" />
        <span>ログアウト</span>
      </button>

    </header>
  );
}