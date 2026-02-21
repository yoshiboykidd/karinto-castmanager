'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, Camera } from 'lucide-react';
import DiaryForm from '@/components/diary/DiaryForm';
import DiaryList from '@/components/diary/DiaryList';

export default function DiaryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const loginId = session.user.email?.split('@')[0];
    
    const { data: profile } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
    setCastProfile(profile);

    const { data: posts } = await supabase
      .from('diary_posts')
      .select('*')
      .eq('cast_id', loginId)
      .order('created_at', { ascending: false });
    
    setMyPosts(posts || []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FFF5F7] pb-32 font-sans text-slate-800">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-pink-400 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
        <h1 className="text-[17px] font-black tracking-tighter flex items-center gap-1.5 text-pink-500"><Camera size={20} />写メ日記</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-md mx-auto space-y-10">
        {/* 📍 新規投稿フォーム */}
        <DiaryForm castProfile={castProfile} onPostSuccess={fetchData} />
        
        <hr className="border-pink-100" />

        {/* 📍 履歴リスト（編集・削除機能付き） */}
        <DiaryList posts={myPosts} onUpdateSuccess={fetchData} />
      </main>
    </div>
  );
}