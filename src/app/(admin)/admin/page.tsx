'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Megaphone, 
  CalendarCheck, 
  ChevronRight, 
  LogOut,
  Store,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const shopName = useMemo(() => {
    if (!adminProfile) return '';
    const loginId = String(adminProfile.login_id || "");
    const prefix = loginId.substring(0, 3);
    const shopMap: Record<string, string> = {
      '001': '神田', '002': '赤坂', '003': '秋葉原', '004': '上野',
      '005': '渋谷', '006': '池袋西口', '007': '五反田', '008': '大宮',
      '009': '吉祥寺', '010': '大久保', '011': '池袋東口', '012': '小岩'
    };
    return shopMap[prefix] ? `${shopMap[prefix]}店` : '管理本部';
  }, [adminProfile]);

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
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-sans text-slate-800">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-12 pb-20 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start max-w-2xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-100 font-black tracking-tight">
              <Store size={24} className="text-indigo-400" /> {shopName}
            </div>
            <h1 className="text-white text-3xl font-black italic tracking-tighter">KCM <span className="text-indigo-400 not-italic">MANAGER</span></h1>
          </div>
          <button onClick={handleLogout} className="bg-white/5 p-3 rounded-2xl border border-white/10 text-slate-400 transition-colors hover:text-red-400"><LogOut size={20} /></button>
        </div>
      </div>

      <main className="px-5 -mt-10 relative z-20 space-y-4 max-w-2xl mx-auto">
        <div className="grid gap-3">
          {[
            { title: '勤怠管理', desc: '本日の出勤確認・当欠遅刻', path: '/admin/attendance', icon: <CalendarCheck className="text-indigo-600" />, border: 'border-indigo-200' },
            { title: 'ニュース配信', desc: 'お客様向け店舗News・イベント', path: '/admin/news?target=user', icon: <Send className="text-blue-600" />, border: 'border-blue-200' },
            { title: 'お知らせ配信(キャスト)', desc: 'キャスト専用の運営連絡・周知', path: '/admin/news?target=cast', icon: <Megaphone className="text-pink-600" />, border: 'border-pink-200' },
            { title: 'キャスト管理', desc: 'メンバーの登録・詳細編集', path: '/admin/members', icon: <Users className="text-slate-600" />, border: 'border-slate-200' },
          ].map((menu, idx) => (
            <button key={idx} onClick={() => router.push(menu.path)} className={`w-full flex items-center p-5 rounded-[28px] border-b-4 bg-white transition-all active:translate-y-1 active:border-b-0 shadow-lg shadow-slate-200/50 ${menu.border}`}>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">{menu.icon}</div>
              <div className="ml-4 text-left flex-1">
                <h3 className="font-black text-slate-800 text-[16px] tracking-tight">{menu.title}</h3>
                <p className="text-slate-400 text-[11px] font-bold">{menu.desc}</p>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}