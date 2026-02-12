'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Megaphone, Plus, Trash2, LogOut, RefreshCw } from 'lucide-react';
import NewsManager from '@/components/admin/NewsManager';

export default function NewsAdminPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('ログアウトしますか？')) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24 font-sans text-gray-800">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl relative">
        <div className="relative z-10 max-w-2xl mx-auto flex justify-between items-start">
          <div className="flex-1">
            <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-gray-400 mb-4 text-xs font-black uppercase tracking-widest">
              <ChevronLeft size={16} /> Back
            </button>
            <h1 className="text-white text-3xl font-black italic tracking-tighter">NEWS</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Broadcast Management</p>
          </div>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <LogOut className="text-pink-400" size={18} />
            </div>
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20">
        <div className="bg-white rounded-[32px] p-2 shadow-xl border border-gray-50">
          {/* 既存の NewsManager コンポーネントを再利用 */}
          <NewsManager targetShopId="all" role="admin" />
        </div>
      </main>
    </div>
  );
}