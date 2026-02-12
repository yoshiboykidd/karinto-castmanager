'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserPlus, RefreshCw, LogOut, Search, Store } from 'lucide-react';
import CastRegister from '@/components/admin/CastRegister';

export default function MembersPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [myProfile, setMyProfile] = useState<{role: string, shop_id: string | null}>({
    role: 'admin', shop_id: null
  });
  const [targetShopId, setTargetShopId] = useState('all');

  const fetchMembers = async (role: string, shopId: string | null, selectedShop: string) => {
    setLoading(true);
    let query = supabase.from('cast_members').select('*').order('login_id', { ascending: true });

    // 📍 権限によるフィルタリング
    if (role !== 'developer') {
      // 店長は自分の店舗ID(3桁)で始まるキャストのみ
      query = query.eq('home_shop_id', shopId);
    } else if (selectedShop !== 'all') {
      // 開発者が店舗を選択している場合
      query = query.eq('home_shop_id', selectedShop);
    }

    const { data } = await query;
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const loginId = session.user.email?.split('@')[0];
      const { data } = await supabase.from('cast_members').select('role, home_shop_id').eq('login_id', loginId).single();
      if (data) {
        setMyProfile({ role: data.role, shop_id: data.home_shop_id });
        const initialShop = data.role === 'developer' ? 'all' : (data.home_shop_id || 'all');
        setTargetShopId(initialShop);
        fetchMembers(data.role, data.home_shop_id, initialShop);
      }
    }
    init();
  }, [supabase, router]);

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24 font-sans text-gray-800">
      {/* 📍 管理画面共通ヘッダー */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl relative">
        <div className="relative z-10 max-w-2xl mx-auto flex justify-between items-start">
          <div className="flex-1">
            <button onClick={() => router.push('/admin')} className="text-gray-400 mb-4 text-xs font-black uppercase tracking-widest">
              <ChevronLeft size={16} className="inline" /> Back
            </button>
            <h1 className="text-white text-3xl font-black italic tracking-tighter">CAST MEMBERS</h1>
          </div>
          <button onClick={handleLogout} className="bg-white/10 p-3 rounded-2xl border border-white/10 text-pink-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20 space-y-4">
        {/* 開発者用：店舗切り替え */}
        {myProfile.role === 'developer' && (
          <div className="bg-white p-2 rounded-[24px] shadow-lg flex gap-1 border border-gray-50 overflow-x-auto">
            {['all', '001', '006', '002'].map((shop) => (
              <button
                key={shop}
                onClick={() => { setTargetShopId(shop); fetchMembers(myProfile.role, myProfile.shop_id, shop); }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${targetShopId === shop ? 'bg-gray-800 text-white' : 'text-gray-400 bg-gray-50'}`}
              >
                {shop === 'all' ? 'ALL' : `SHOP:${shop}`}
              </button>
            ))}
          </div>
        )}

        <button 
          onClick={() => setShowRegister(!showRegister)}
          className={`w-full h-16 rounded-[24px] shadow-lg flex items-center justify-center gap-2 font-black text-sm transition-all ${showRegister ? 'bg-gray-800 text-white' : 'bg-pink-500 text-white'}`}
        >
          <UserPlus size={20} /> {showRegister ? '登録画面を閉じる' : '新規キャスト登録'}
        </button>

        {showRegister ? (
          <CastRegister 
            role={myProfile.role} 
            myShopId={myProfile.shop_id} 
            targetShopId={targetShopId}
            onSuccess={() => { setShowRegister(false); fetchMembers(myProfile.role, myProfile.shop_id, targetShopId); }}
          />
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-[28px] shadow-md border-2 border-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase">Login ID</span>
                    <span className="text-[12px] font-black text-gray-800 font-mono tracking-tighter">{m.login_id}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg">{m.display_name}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <Store size={10} />
                      <span>{m.home_shop_id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}