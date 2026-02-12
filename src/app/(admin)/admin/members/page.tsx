'use client';

import { useState, useEffect } from 'react';
import { UserPlus, RefreshCw, Search, ChevronRight, Trash2 } from 'lucide-react';
import CastRegister from '@/components/admin/CastRegister';
import { getFilteredMembers, deleteMember } from './actions';

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

  const handleDelete = async (loginId: string, name: string) => {
    if (!confirm(`【削除確認】\n${name} (${loginId})\nこのキャストを完全に削除しますか？`)) {
      return;
    }
    const result = await deleteMember(loginId);
    if (result.success) {
      loadData();
    } else {
      alert('削除に失敗しました。');
    }
  };

  const filteredMembers = (members || []).filter(m => 
    m?.display_name?.includes(searchQuery) || 
    m?.login_id?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      {/* ヘッダーエリア */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-md shadow-slate-200/50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
              CAST LIST
              <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                {members.length}
              </span>
            </h1>
            <button 
              onClick={() => setShowRegister(true)}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <UserPlus size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Add Cast</span>
            </button>
          </div>

          <div className="space-y-4">
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

      {/* リスト部分：一人一人の「帯」を強調 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <RefreshCw className="animate-spin mb-2" size={24} />
            <span className="text-[10px] font-black tracking-widest">LOADING</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2"> {/* 📍 gapで帯同士に隙間を作る */}
            {filteredMembers.length > 0 ? (
              filteredMembers.map((m) => (
                <div 
                  key={m.login_id} 
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    {/* 📍 ID：フォントを大きく、太く、色を濃く */}
                    <div className="flex flex-col leading-none">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-1">Login ID</span>
                      <span className="text-lg font-mono font-black text-slate-900 tracking-tighter">
                        {m.login_id}
                      </span>
                    </div>
                    {/* 名前部分 */}
                    <div className="h-8 w-[2px] bg-slate-100 mx-1" /> {/* 仕切り線 */}
                    <span className="font-black text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                      {m.display_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDelete(m.login_id, m.display_name)}
                      className="p-2.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-300" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white rounded-[30px] border border-dashed border-slate-200">
                No Data Found
              </div>
            )}
          </div>
        )}
      </div>

      {/* 登録モーダル */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRegister(false)} 
              className="absolute -top-12 right-0 text-white/50 hover:text-white text-xs font-black uppercase tracking-widest p-2"
            >
              Close [×]
            </button>
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