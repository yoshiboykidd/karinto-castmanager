'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, RefreshCw, Store, ShieldCheck, Search, ChevronRight } from 'lucide-react';
import CastRegister from '@/components/admin/CastRegister';
// 📍 actions.ts からロジックをインポート
import { getFilteredMembers } from './actions';

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [myProfile, setMyProfile] = useState<{role: string, home_shop_id: string | null} | null>(null);
  const [targetShopId, setTargetShopId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 📍 データを取得する関数
  const loadData = async () => {
    setLoading(true);
    try {
      // actions.ts の getFilteredMembers を呼び出し
      const result = await getFilteredMembers(targetShopId);
      setMembers(result.members);
      setMyProfile(result.myProfile);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetShopId]);

  // 🔍 検索フィルタリング（表示用）
  const filteredMembers = members.filter(m => 
    m.display_name?.includes(searchQuery) || 
    m.login_id?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* ヘッダーエリア */}
      <div className="bg-white px-8 pt-16 pb-10 rounded-b-[50px] shadow-sm border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {myProfile?.role === 'developer' ? (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-tighter animate-pulse">
                    GOD MODE / ALL SHOPS
                  </span>
                ) : (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-tighter uppercase">
                    Manager / Shop {myProfile?.home_shop_id}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                Member List
                <span className="text-sm font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-xl">
                  {members.length}
                </span>
              </h1>
            </div>
            <button 
              onClick={() => setShowRegister(true)}
              className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center gap-2"
            >
              <UserPlus size={20} />
              <span className="text-xs font-black uppercase tracking-widest hidden md:block">Add Cast</span>
            </button>
          </div>

          {/* 検索 & 店舗フィルター */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search by name or ID..."
                className="w-full bg-slate-50 border-none rounded-[25px] py-4 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 開発者のみ店舗切り替えボタンを表示 */}
            {myProfile?.role === 'developer' && (
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {['all', '001', '002', '003', '004'].map((id) => (
                  <button
                    key={id}
                    onClick={() => setTargetShopId(id)}
                    className={`px-6 py-4 rounded-[25px] text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      targetShopId === id 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {id === 'all' ? 'All Shops' : `Shop ${id}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メインリスト */}
      <div className="max-w-4xl mx-auto px-6 mt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="text-blue-500 animate-spin mb-4" size={32} />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synchronizing...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((m) => (
                <div 
                  key={m.login_id} 
                  className="bg-white p-5 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[22px] bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                      <span className="text-[8px] font-black text-slate-300 uppercase">ID</span>
                      <span className="text-[13px] font-black text-slate-800 font-mono">{m.login_id}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{m.display_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Store size={10} /> {m.home_shop_id}
                        </div>
                        {m.role === 'admin' && (
                          <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md uppercase">Manager</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100">
                <p className="font-black text-slate-200 text-xl italic tracking-tighter mb-2">NO CAST MEMBERS FOUND</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 登録用モーダル（既存コンポーネント） */}
      {showRegister && (
        <CastRegister 
          onClose={() => setShowRegister(false)} 
          onSuccess={() => {
            setShowRegister(false);
            loadData();
          }} 
        />
      )}
    </div>
  );
}