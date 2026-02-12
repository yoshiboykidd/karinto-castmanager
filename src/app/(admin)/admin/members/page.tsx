'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { UserPlus, RefreshCw, Store, ShieldCheck, Search } from 'lucide-react';
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
  const [myProfile, setMyProfile] = useState<{role: string, shop_id: string | null} | null>(null);
  const [targetShopId, setTargetShopId] = useState('all');

  // 📍 キャスト一覧を取得する関数
  const fetchMembers = async (role: string, shopId: string | null, selectedShop: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('cast_members')
        .select('*')
        .order('login_id', { ascending: true });

      // 🔐 権限によるフィルタリング
      if (role === 'developer') {
        // 開発者（神）: 選択された店舗があれば絞り込み。なければ全表示。
        if (selectedShop !== 'all') {
          query = query.eq('home_shop_id', selectedShop);
        }
      } else {
        // 店長: 自分の店舗IDのキャストのみ。
        // もし shopId が null なら、何も表示されないようにする（セキュリティ）
        if (shopId) {
          query = query.eq('home_shop_id', shopId);
        } else {
          setMembers([]);
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 📍 初期化：自分のプロフィールを確認して初回フェッチ
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const loginId = session.user.email?.split('@')[0];
      const { data: profile } = await supabase
        .from('cast_members')
        .select('role, home_shop_id')
        .eq('login_id', loginId)
        .single();

      if (profile) {
        setMyProfile({ role: profile.role, shop_id: profile.home_shop_id });
        // 開発者なら 'all'、店長なら自分の店舗を初期値に
        const initialShop = profile.role === 'developer' ? 'all' : (profile.home_shop_id || '');
        setTargetShopId(initialShop);
        fetchMembers(profile.role, profile.home_shop_id, initialShop);
      }
    }
    init();
  }, [supabase]);

  if (!myProfile) return <div className="p-10 text-center animate-pulse font-black text-gray-300">AUTHENTICATING...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24">
      {/* ヘッダー */}
      <div className="bg-slate-900 pt-12 pb-16 px-6 rounded-b-[40px] shadow-2xl relative">
        <h1 className="text-white text-3xl font-black italic tracking-tighter">CAST MEMBERS</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${myProfile.role === 'developer' ? 'bg-purple-500' : 'bg-blue-500'} text-white uppercase`}>
            {myProfile.role === 'developer' ? 'GOD MODE' : `MANAGER: ${myProfile.shop_id}`}
          </span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20 space-y-4">
        {/* 開発者専用：店舗フィルター */}
        {myProfile.role === 'developer' && (
          <div className="bg-white p-2 rounded-2xl shadow-lg flex gap-1 overflow-x-auto border border-gray-100">
            {['all', '001', '006', '002'].map((shop) => (
              <button
                key={shop}
                onClick={() => { setTargetShopId(shop); fetchMembers(myProfile.role, myProfile.shop_id, shop); }}
                className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all shrink-0 ${targetShopId === shop ? 'bg-slate-800 text-white' : 'bg-gray-50 text-gray-400'}`}
              >
                {shop === 'all' ? 'ALL' : `SHOP:${shop}`}
              </button>
            ))}
          </div>
        )}

        {/* 登録ボタンの切り替え */}
        <button 
          onClick={() => setShowRegister(!showRegister)}
          className={`w-full h-16 rounded-[24px] shadow-xl flex items-center justify-center gap-2 font-black text-sm transition-all active:scale-95 ${showRegister ? 'bg-slate-800 text-white' : 'bg-pink-500 text-white'}`}
        >
          {showRegister ? '一覧を表示する' : '新規キャスト登録を開く'}
        </button>

        {showRegister ? (
          <CastRegister 
            role={myProfile.role} 
            myShopId={myProfile.shop_id} 
            targetShopId={targetShopId === 'all' ? (myProfile.shop_id || '001') : targetShopId}
            onSuccess={() => {
              setShowRegister(false);
              fetchMembers(myProfile.role, myProfile.shop_id, targetShopId);
            }} 
          />
        ) : (
          <div className="space-y-2">
            {loading ? (
              <div className="py-12 text-center text-gray-300 font-black italic">LOADING MEMBERS...</div>
            ) : members.length > 0 ? (
              members.map((m) => (
                <div key={m.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-gray-50">
                      <span className="text-[8px] font-black text-gray-300 uppercase">ID</span>
                      <span className="text-[13px] font-black text-slate-800 font-mono">{m.login_id}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">{m.display_name}</h3>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Store size={10} /> {m.home_shop_id}
                      </div>
                    </div>
                  </div>
                  <ShieldCheck size={20} className={m.role === 'cast' ? 'text-gray-100' : 'text-blue-500'} />
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                <p className="font-black text-gray-300 italic">NO CAST MEMBERS FOUND</p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em]">Check shop filter or RLS settings</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}