'use client';

import { useState, useEffect } from 'react';
import { UserPlus, RefreshCw, Search, ChevronRight } from 'lucide-react';
import CastRegister from '@/components/admin/CastRegister';
import { getFilteredMembers } from './actions';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [myProfile, setMyProfile] = useState<{role: string, home_shop_id: string | null} | null>(null);
  const [targetShopId, setTargetShopId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getFilteredMembers(targetShopId);
      if (result) {
        setMembers(result.members || []);
        setMyProfile(result.myProfile || null);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetShopId]);

  const filteredMembers = (members || []).filter(m => 
    m?.display_name?.includes(searchQuery) || 
    m?.login_id?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* ヘッダーエリア：少しコンパクトに */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
              CAST LIST
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                {members.length}
              </span>
            </h1>
            <button 
              onClick={() => setShowRegister(true)}
              className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <UserPlus size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* 検索窓 */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 店舗フィルター：開発者のみ表示。横スクロール可能 */}
            {myProfile?.role === 'developer' && (
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {['all', '001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012'].map((id) => (
                  <button
                    key={id}
                    onClick={() => setTargetShopId(id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${
                      targetShopId === id 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {id === 'all' ? 'ALL' : id}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* リスト：詰め詰めのデザイン */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <RefreshCw className="animate-spin mb-2" size={24} />
            <span className="text-[10px] font-black tracking-widest">LOADING</span>
          </div>
        ) : (
          <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
            {filteredMembers.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {filteredMembers.map((m) => (
                  <div 
                    key={m.login_id} 
                    className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* ID部分：シンプルにフォントのみ */}
                      <span className="text-[12px] font-mono font-black text-slate-400 w-16">
                        {m.login_id}
                      </span>
                      {/* 名前部分 */}
                      <span className="font-black text-slate-700 text-sm group-hover:text-blue-600">
                        {m.display_name}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-slate-200 group-hover:text-blue-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                No Data
              </div>
            )}
          </div>
        )}
      </div>

      {/* 登録モーダル */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <button onClick={() => setShowRegister(false)} className="absolute -top-10 right-0 text-white/50 text-xs font-black uppercase">Close</button>
            <CastRegister 
              role={myProfile?.role} 
              myShopId={myProfile?.home_shop_id} 
              targetShopId={targetShopId}
              onClose={() => setShowRegister(false)} 
              onSuccess={() => {
                setShowRegister(false);
                loadData();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}