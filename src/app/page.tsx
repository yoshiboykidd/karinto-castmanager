"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Home, Newspaper, User, LogOut, Save, 
  ChevronLeft, Loader2, AlertCircle, CheckCircle2,
  Calendar, CreditCard, PenLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface PerformanceData {
  id?: string;
  cast_id: string;
  date: string;
  achievement: string;
  reward_amount: number;
  memo?: string;
}

export default function PerformanceEntryPage() {
  const router = useRouter();
  
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  
  const [castId, setCastId] = useState<string | null>(null);
  const [achievement, setAchievement] = useState("");
  const [reward, setReward] = useState("");
  const [memo, setMemo] = useState("");

  // 今日の日付 (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // --- Data Fetching ---
  const fetchPerformance = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('performances')
        .select('*')
        .eq('cast_id', userId)
        .eq('date', today)
        .single();

      if (data) {
        setAchievement(data.achievement);
        setReward(data.reward_amount.toString());
        setMemo(data.memo || "");
      }
    } catch (err) {
      console.log("No data found for today, starting fresh.");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCastId(user.id);
      fetchPerformance(user.id);
    };
    checkUser();
  }, [router, fetchPerformance]);

  // --- Handlers ---
  const handleSave = async () => {
    if (!castId) return;
    setSaving(true);
    setStatus({ type: null, msg: '' });

    const payload: PerformanceData = {
      cast_id: castId,
      date: today,
      achievement,
      reward_amount: parseInt(reward) || 0,
      memo
    };

    const { error } = await supabase
      .from('performances')
      .upsert(payload, { onConflict: 'cast_id,date' });

    if (error) {
      setStatus({ type: 'error', msg: '保存に失敗しました。' });
    } else {
      setStatus({ type: 'success', msg: '実績を保存しました！' });
      setTimeout(() => setStatus({ type: null, msg: '' }), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-pink-300" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBFC] text-gray-800 pb-32">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-50 px-4 py-4 sticky top-0 z-30 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 text-pink-400 active:bg-pink-50 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold text-gray-400 tracking-widest uppercase">Performance Report</h1>
          <p className="text-xs font-medium text-pink-400">{today.replace(/-/g, '/')}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        
        {/* STATUS TOAST */}
        <AnimatePresence>
          {status.type && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm ${
                status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-bold">{status.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. 実績入力：グレーアウトを排除したクリーンな設計 */}
        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-pink-50/50">
          <div className="flex items-center gap-3 mb-6 text-pink-400">
            <div className="bg-pink-50 p-2 rounded-xl">
              <PenLine size={20} />
            </div>
            <h2 className="font-bold tracking-tight">本日の実績詳細</h2>
          </div>
          
          <div className="relative group">
            <textarea
              rows={3}
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              placeholder="例：指名 3、フリー 5"
              className="w-full bg-white border-b-2 border-gray-50 
                         focus:border-pink-300 focus:outline-none 
                         caret-pink-500 py-2 text-lg leading-relaxed
                         transition-all duration-300 placeholder:text-gray-200 resize-none"
            />
            {/* 以前のVerで不快だった「クリック時の背景色変化」を完全に排除 */}
          </div>
        </section>

        {/* 2. 報酬入力：左端￥マーク ＆ 6桁（1,000,000未満）対応 */}
        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-pink-50/50">
          <div className="flex items-center gap-3 mb-6 text-pink-400">
            <div className="bg-pink-50 p-2 rounded-xl">
              <CreditCard size={20} />
            </div>
            <h2 className="font-bold tracking-tight">獲得報酬（見込み）</h2>
          </div>

          <div className="relative flex items-center border-b-2 border-gray-50 focus-within:border-pink-300 transition-all duration-300 pb-2">
            {/* ￥マークを左に固定：pl（左余白）を十分に確保して重なりを防止 */}
            <span className="text-3xl font-black text-pink-100 mr-2 select-none">￥</span>
            
            <input
              type="number"
              inputMode="numeric"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="0"
              // text-rightで右寄せ。6桁入っても左の￥マークと干渉しない
              className="w-full bg-transparent focus:outline-none 
                         text-right text-4xl font-mono font-bold text-gray-700
                         caret-pink-500 placeholder:text-gray-100"
              min="0"
              max="999999"
            />
          </div>
          <p className="text-right text-[10px] text-gray-300 mt-2 font-bold tracking-tighter uppercase">
            Max 999,999 JPY Available
          </p>
        </section>

        {/* 保存アクション */}
        <div className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full h-16 bg-gradient-to-r from-pink-300 to-pink-400 text-white font-black rounded-2xl 
                       shadow-xl shadow-pink-200/50 flex items-center justify-center gap-3 
                       active:scale-[0.95] disabled:opacity-50 transition-all text-lg tracking-widest"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
            UPDATE DATA
          </button>
        </div>
      </main>

      {/* FOOTER NAV (Fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-pink-50 px-8 py-4 pb-8 z-40">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavItem icon={<Home size={22}/>} label="HOME" onClick={() => router.push('/dashboard')} />
          <NavItem icon={<Newspaper size={22}/>} label="NEWS" onClick={() => router.push('/news')} />
          <NavItem icon={<PenLine size={22}/>} label="実績入力" active />
          <NavItem icon={<User size={22}/>} label="MY PAGE" onClick={() => router.push('/profile')} />
          <NavItem icon={<LogOut size={22}/>} label="EXIT" onClick={() => supabase.auth.signOut()} />
        </div>
      </nav>

      {/* Ver Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <span className="text-[8px] text-gray-200 font-mono tracking-widest">KCM-INTERNAL-SYSTEM v2.6.0 / STABLE</span>
      </div>
    </div>
  );
}

// --- Sub Components ---
function NavItem({ icon, label, onClick, active = false }: { icon: any, label: string, onClick?: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-pink-500 scale-110' : 'text-gray-300 hover:text-pink-300'}`}
    >
      {icon}
      <span className="text-[9px] font-black tracking-tighter">{label}</span>
      {active && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-pink-500 rounded-full mt-0.5" />}
    </button>
  );
}