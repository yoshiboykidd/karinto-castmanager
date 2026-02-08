import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, CalendarCheck, Users, LogOut, ChevronLeft } from 'lucide-react';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* サイドバー（PC用）/ 下部ナビ（スマホ用）の使い分けが理想ですが、まずはシンプルなサイドバー形式で */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-800 text-white sticky top-0 h-screen">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-wider text-pink-400">KCM Admin</h2>
          <p className="text-xs text-slate-400">Karinto Cast Manager</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <AdminNavLink href="/admin" icon={<LayoutDashboard size={20} />} label="ダッシュボード" />
          <AdminNavLink href="/admin/attendance" icon={<CalendarCheck size={20} />} label="出勤・勤怠管理" />
          <AdminNavLink href="/admin/members" icon={<Users size={20} />} label="キャスト名簿" />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
            一般画面へ戻る
          </Link>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* スマホ用簡易ヘッダー */}
        <header className="md:hidden bg-slate-800 text-white p-4 flex justify-between items-center">
          <h1 className="font-bold text-pink-400">KCM Admin</h1>
          <nav className="flex gap-4">
            <Link href="/admin/attendance"><CalendarCheck size={24} /></Link>
            <Link href="/admin/members"><Users size={24} /></Link>
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ナビ用パーツ
function AdminNavLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors font-medium">
      {icon}
      {label}
    </Link>
  );
}