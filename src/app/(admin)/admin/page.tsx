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
  Send // 📍 ニュース配信用のアイコンを追加
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
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }} 
        />
        
        <div className="relative z-10 flex justify-between items-start max-w-2xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store className="text-indigo-400" size={24} />
              <h2 className="text-indigo-100 text-[18px] font-black tracking-tight">{shopName}</h2>
            </div>
            <h1 className="text-white text-3xl font-black italic tracking-tighter flex items-center gap-2">
              KCM <span className="text-indigo-400 not-italic">MANAGER</span>
            </h1>
            <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full w-fit">
              <ShieldCheck className="text-indigo-400" size={10} />
              <p className="text-indigo-300 text-[9px] font-black uppercase tracking-[0.2em]">Authorized Access</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="group flex flex-col items-center gap-1">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md group-active:scale-90 transition-all">
              <LogOut className="text-slate-400 group-hover:text-red-400" size={20} />
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase">Exit</span>
          </button>
        </div>
      </div>

      <main className="px-5 -mt-10 relative z-20 space-y-4 max-w-2xl mx-auto">
        <div className="grid gap-3">
          {[
            { 
              title: '勤怠管理', 
              desc: '本日の出勤確認・当欠遅刻の入力', 
              path: '/admin/attendance', 
              icon: <CalendarCheck className="text-indigo-600" />, 
              border: 'border-indigo-200' 
            },
            { 
              title: 'ニュース配信', 
              desc: 'お客様向けの店舗News・イベント情報', 
              path: '/admin/news?target=user', // 📍 ターゲット指定
              icon: <Send className="text-blue-600" />, 
              border: 'border-blue-200' 
            },
            { 
              title: 'お知らせ配信(キャスト)', 
              desc: 'キャスト専用の運営連絡・周知事項', 
              path: '/admin/news?target=cast', // 📍 ターゲット指定
              icon: <Megaphone className="text-pink-600" />, 
              border: 'border-pink-200' 
            },
            { 
              title: 'キャスト管理', 
              desc: '在籍メンバーの登録・詳細編集', 
              path: '/admin/members', 
              icon: <Users className="text-slate-600" />, 
              border: 'border-slate-200' 
            },
          ].map((menu, idx) => (
            <button 
              key={idx} 
              onClick={() => router.push(menu.path)} 
              className={`w-full flex items-center p-5 rounded-[28px] border-b-4 bg-white transition-all active:translate-y-1 active:border-b-0 shadow-lg shadow-slate-200/50 ${menu.border}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                {menu.icon}
              </div>
              <div className="ml-4 text-left flex-1">
                <h3 className="font-black text-slate-800 text-[16px] tracking-tight">{menu.title}</h3>
                <p className="text-slate-400 text-[11px] font-bold">{menu.desc}</p>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between px-6 py-4 bg-slate-800 rounded-[30px] shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-[10px]">
              {adminProfile?.display_name?.substring(0, 1)}
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none">Login User</p>
              <p className="text-white text-[13px] font-bold">{adminProfile?.display_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none">Role</p>
            <p className="text-indigo-400 text-[11px] font-black">{adminProfile?.role?.toUpperCase()}</p>
          </div>
        </div>
      </main>
    </div>
  );
}