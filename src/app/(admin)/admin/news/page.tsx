'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, LogOut, ShieldAlert } from 'lucide-react';
import NewsManager from '@/components/admin/NewsManager';

export default function NewsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [myProfile, setMyProfile] = useState<{role: string, shop_id: string | null}>({
    role: 'admin',
    shop_id: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // ログインユーザーの権限と所属店舗を取得
      const { data } = await supabase
        .from('cast_members')
        .select('role, home_shop_id')
        .eq('login_id', session.user.email?.split('@')[0])
        .single();

      if (data) {
        setMyProfile({
          role: data.role, // 'developer' か 'admin' (店長)
          shop_id: data.home_shop_id
        });
      }
      setLoading(false);
    }
    getProfile();
  }, [supabase, router]);

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24 font-sans text-gray-800">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl relative">
        <div className="relative z-10 max-w-2xl mx-auto flex justify-between items-start">
          <div>
            <button onClick={() => router.push('/admin')} className="text-gray-400 mb-4 text-xs font-black uppercase tracking-widest">
              <ChevronLeft size={16} className="inline" /> Dashboard
            </button>
            <h1 className="text-white text-3xl font-black italic tracking-tighter">NEWS FEED</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${myProfile.role === 'developer' ? 'bg-purple-500' : 'bg-blue-500'} text-white uppercase`}>
                {myProfile.role === 'developer' ? 'GOD MODE' : `MANAGER: ${myProfile.shop_id}`}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 p-3 rounded-2xl border border-white/10 text-pink-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20">
        {/* 📍 権限情報をコンポーネントに渡す */}
        <NewsManager 
          role={myProfile.role} 
          myShopId={myProfile.shop_id} 
        />
      </main>
    </div>
  );
}