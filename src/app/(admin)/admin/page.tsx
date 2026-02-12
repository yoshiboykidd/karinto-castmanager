'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Megaphone, 
  CalendarCheck, 
  Settings, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const loginId = session.user.email?.split('@')[0];
      const { data } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
      if (data?.role !== 'admin' && data?.role !== 'developer') {
        router.push('/');
        return;
      }
      setAdminProfile(data);
      setLoading(false);
    }
    checkAuth();
  }, [supabase, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-10 font-sans text-gray-800">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-12 pb-16 px-6 rounded-b-[50px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start max-w-2xl mx-auto">
          <div>
            <h1 className="text-white text-3xl font-black italic tracking-tighter">KCM ADMIN</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">Dashboard</p>
          </div>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <LogOut className="text-pink-400" size={20} />
            </div>
            <span className="text-[9px] font-black text-white/40 uppercase">Logout</span>
          </button>
        </div>
      </div>

      <main className="px-5 -mt-8 relative z-20 space-y-4 max-w-2xl mx-auto">
        <div className="grid gap-3">
          {[
            { title: 'キャスト管理', desc: 'メンバーの登録・編集', path: '/admin/members', icon: <Users className="text-blue-500" />, color: 'border-blue-100 bg-blue-50/30' },
            { title: '勤怠管理', desc: '本日の出勤状況', path: '/admin/attendance', icon: <CalendarCheck className="text-green-500" />, color: 'border-green-100 bg-green-50/30' },
            { title: 'ニュース配信', desc: 'お知らせの管理', path: '/admin/news', icon: <Megaphone className="text-pink-500" />, color: 'border-pink-100 bg-pink-50/30' },
          ].map((menu, idx) => (
            <button key={idx} onClick={() => router.push(menu.path)} className={`w-full flex items-center p-5 rounded-[32px] border-2 transition-all active:scale-[0.97] bg-white shadow-xl shadow-gray-200/40 ${menu.color}`}>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">{menu.icon}</div>
              <div className="ml-4 text-left flex-1">
                <h3 className="font-black text-gray-800 text-[16px] tracking-tight">{menu.title}</h3>
                <p className="text-gray-400 text-[11px] font-bold">{menu.desc}</p>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}