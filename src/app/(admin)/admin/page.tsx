'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

// 作成した部品を読み込み（パスに注意！）
// もしエラーが出たら import ... from '../../components/admin/CastRegister'; に変えてみて
import CastRegister from '@/components/admin/CastRegister';
import NewsManager from '@/components/admin/NewsManager';

// 店舗リスト（将来はDBから取得してもOK）
const SHOP_LIST = [
  { id: 'all', name: '📢 全店舗共通' },
  { id: '001', name: '📍 神田' },  // IDはshop_masterに合わせて修正
  { id: '002', name: '📍 赤坂' },
  { id: '003', name: '📍 秋葉原' }, // あなたの環境に合わせて修正してください
  { id: '004', name: '📍 上野' },
  { id: '005', name: '📍 渋谷' },
  { id: '006', name: '📍 池西' },
  { id: '007', name: '📍 五反田' },
  { id: '008', name: '📍 大宮' },
  { id: '009', name: '📍 吉祥寺' },
  { id: '010', name: '📍 大久保' },
  { id: '011', name: '📍 池東' },
  { id: '012', name: '📍 小岩' },
];

export default function AdminPage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [targetShopId, setTargetShopId] = useState('all');
  const [activeTab, setActiveTab] = useState<'cast' | 'news'>('cast'); // ✨ ここでタブの状態管理
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

      // 店長ならターゲット店舗を自分の店に固定
      if (member.role === 'admin' && member.home_shop_id) {
        setTargetShopId(member.home_shop_id);
      }
      setLoading(false);
    }
    initAdmin();
  }, [supabase, router]);

  if (loading) return <div className="p-10 text-center font-bold text-pink-400 animate-pulse">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 font-sans text-gray-800">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* ヘッダー */}
        <header className="flex justify-between items-center px-2">
          <h1 className="text-xl font-black tracking-tighter">MANAGER CENTER ⚙️</h1>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${role === 'developer' ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-500'}`}>
            {role === 'developer' ? 'Developer' : `${myShopId} Manager`}
          </span>
        </header>

        {/* 開発者用: 店舗切替ボタン */}
        {role === 'developer' && (
          <section className="bg-white p-4 rounded-3xl shadow-sm border border-purple-100">
             <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest block mb-2">Target Shop</label>
             <div className="grid grid-cols-2 gap-2">
                {SHOP_LIST.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => setTargetShopId(shop.id)}
                    className={`text-xs py-2 rounded-xl font-bold transition-all border ${
                      targetShopId === shop.id 
                      ? 'bg-purple-500 text-white border-purple-500' 
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}
                  >
                    {shop.name}
                  </button>
                ))}
             </div>
          </section>
        )}

        {/* ✨ ここがタブ切り替えスイッチ！ */}
        <div className="flex bg-gray-200 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('cast')}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'cast' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            👩🏻‍💼 キャスト登録
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'news' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            📢 ニュース配信
          </button>
        </div>

        {/* ✨ 中身が切り替わるエリア */}
        <div className="min-h-[400px]">
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