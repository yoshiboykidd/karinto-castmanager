'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ChevronLeft, LogOut } from 'lucide-react';
import NewsManager from '@/components/admin/NewsManager';

export default function NewsPage() {
  const router = useRouter();
  const supabase = createClient();
  
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
      const { data } = await supabase.from('cast_members').select('role, home_shop_id').eq('login_id', session.user.email?.split('@')[0]).single();
      if (data) { setMyProfile({ role: data.role, shop_id: data.home_shop_id }); }
      setLoading(false);
    }
    getProfile();
  }, [supabase, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24 font-sans text-gray-800">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl relative">
        <div className="relative z-10 max-w-2xl mx-auto flex justify-between items-start">
          <div>
            <button onClick={() => router.push('/admin')} className="text-gray-400 mb-4 text-xs font-black uppercase tracking-widest flex items-center gap-1">
              <ChevronLeft size={16} /> Dashboard
            </button>
            <h1 className="text-white text-3xl font-black italic tracking-tighter uppercase">Broadcast</h1>
          </div>
          <button onClick={() => { supabase.auth.signOut(); router.push('/login'); }} className="bg-white/10 p-3 rounded-2xl border border-white/10 text-pink-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20">
        <Suspense fallback={<div className="text-center p-10 font-bold text-gray-400">Loading...</div>}>
          <NewsManager role={myProfile.role} myShopId={myProfile.shop_id} />
        </Suspense>
      </main>
    </div>
  );
}