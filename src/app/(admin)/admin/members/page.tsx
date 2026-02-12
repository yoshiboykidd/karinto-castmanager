'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserPlus, Search, RefreshCw, LogOut, Trash2, Key } from 'lucide-react';
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

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cast_members')
      .select('*')
      .order('login_id', { ascending: true });
    if (!error) setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

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
            <h1 className="text-white text-3xl font-black italic tracking-tighter">MEMBERS</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Cast Management</p>
          </div>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <LogOut className="text-pink-400" size={18} />
            </div>
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20 space-y-4">
        {/* アクションバー */}
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRegister(!showRegister)}
            className="flex-1 h-16 bg-pink-500 text-white rounded-[24px] shadow-lg shadow-pink-200 flex items-center justify-center gap-2 font-black text-sm active:scale-95 transition-all"
          >
            <UserPlus size={20} /> {showRegister ? '一覧に戻る' : '新規登録'}
          </button>
          <button onClick={fetchMembers} className="w-16 h-16 bg-white rounded-[24px] shadow-md border border-gray-100 flex items-center justify-center text-gray-400">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {showRegister ? (
          <div className="animate-in zoom-in-95 duration-200">
            <CastRegister targetShopId="all" />
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-[28px] shadow-md border-2 border-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs">
                    {m.login_id}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800">{m.display_name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.role} / {m.home_shop_id}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-gray-300 hover:text-blue-500"><Key size={18} /></button>
                  <button className="p-2 text-gray-300 hover:text-rose-500"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}