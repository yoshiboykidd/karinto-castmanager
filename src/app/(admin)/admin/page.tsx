'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import CastRegister from '@/components/admin/CastRegister';
import NewsManager from '@/components/admin/NewsManager';

const SHOP_LIST = [
  { id: 'all', name: '📢 全店舗' },
  { id: '001', name: '📍 神田' }, { id: '002', name: '📍 赤坂' },
  { id: '003', name: '📍 秋葉原' }, { id: '004', name: '📍 上野' },
  { id: '005', name: '📍 渋谷' }, { id: '006', name: '📍 池西' },
  { id: '007', name: '📍 五反田' }, { id: '008', name: '📍 大宮' },
  { id: '009', name: '📍 吉祥寺' }, { id: '010', name: '📍 大久保' },
  { id: '011', name: '📍 池東' }, { id: '012', name: '📍 小岩' },
];

export default function AdminPage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [targetShopId, setTargetShopId] = useState('all');
  const [activeTab, setActiveTab] = useState<'cast' | 'news'>('cast');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [myShopId, setMyShopId] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    async function initAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user.email) {
        router.push('/login');
        return;
      }

      const loginId = session.user.email.split('@')[0];
      const { data: member, error } = await supabase
        .from('cast_members')
        .select('role, home_shop_id')
        .eq('login_id', loginId)
        .single();

      if (error || !member || (member.role !== 'developer' && member.role !== 'admin')) {
        alert('権限がありません');
        router.push('/');
        return;
      }

      setRole(member.role);
      setMyShopId(member.home_shop_id);
      if (member.role === 'admin' && member.home_shop_id) {
        setTargetShopId(member.home_shop_id);
      }
      setLoading(false);
    }
    initAdmin();
  }, [supabase, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
      <div className="font-black text-pink-300 animate-pulse text-4xl italic tracking-tighter">MANAGER...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-20 font-sans text-gray-800">
      {/* 📍 ヘッダーを可愛く修正 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg mb-[-24px]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h1 className="text-white text-2xl font-black italic tracking-tighter">MANAGER CENTER</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Control Panel v2.0</p>
          </div>
          <span className={`text-[10px] font-black px-4 py-1.5 rounded-full shadow-inner ${
            role === 'developer' ? 'bg-purple-500 text-white' : 'bg-pink-500 text-white'
          }`}>
            {role === 'developer' ? 'DEVELOPER' : `SHOP:${myShopId}`}
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">
        {/* 開発者用: 店舗切替 */}
        {role === 'developer' && (
          <section className="bg-white p-4 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-50">
             <label className="text-[10px] font-black text-gray-300 ml-2 uppercase tracking-widest block mb-3">Target Shop Selection</label>
             <div className="grid grid-cols-3 gap-1.5">
                {SHOP_LIST.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => setTargetShopId(shop.id)}
                    className={`text-[10px] py-2.5 rounded-xl font-black transition-all border ${
                      targetShopId === shop.id 
                      ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
                      : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {shop.name.replace('📍 ', '')}
                  </button>
                ))}
             </div>
          </section>
        )}

        {/* タブ切り替え */}
        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[24px] border border-gray-100 shadow-sm mx-2">
          <button
            onClick={() => setActiveTab('cast')}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'cast' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            👩🏻‍💼 キャスト登録
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'news' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            📢 ニュース配信
          </button>
        </div>

        {/* メインエリア */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 px-1">
          {activeTab === 'cast' ? (
            <CastRegister targetShopId={targetShopId} />
          ) : (
            <NewsManager targetShopId={targetShopId} role={role || ''} myShopId={myShopId} />
          )}
        </div>
      </div>
    </div>
  );
}