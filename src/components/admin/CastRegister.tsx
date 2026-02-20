'use client';

import { useState, useEffect } from 'react';
// 📍 共通クライアントをインポートするように変更
import { createClient } from '@/utils/supabase/client';
import { createCast } from '@/app/(admin)/admin/members/actions';
import { UserPlus, RefreshCw, Sparkles, User } from 'lucide-react';

export default function CastRegister({ role, myShopId, targetShopId, onSuccess }: any) {
  // 📍 修正: 共通クライアントを使用することで多重インスタンス警告を回避
  const supabase = createClient();
  const [newCastName, setNewCastName] = useState('');
  const [suggestedId, setSuggestedId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeShopId = role === 'developer' ? targetShopId : (myShopId || '');

  useEffect(() => {
    async function getNextId() {
      if (!activeShopId || activeShopId === 'all') return;
      const prefix = `${activeShopId}0`;
      const { data } = await supabase.from('cast_members').select('login_id').like('login_id', `${prefix}%`).order('login_id', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const lastSeq = parseInt(data[0].login_id.slice(-4));
        setSuggestedId(`${prefix}${String(lastSeq + 1).padStart(4, '0')}`);
      } else { setSuggestedId(`${prefix}0001`); }
    }
    getNextId();
  }, [activeShopId, supabase]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('display_name', newCastName);
    formData.append('personal_number', suggestedId);
    formData.append('home_shop_id', activeShopId);
    
    // Server Actionを実行
    const result = await createCast(formData);
    if (result.success) {
      // 📍 案内するパスワードも 000000 に修正
      alert(`✨ 登録完了: ${newCastName}\nID: ${suggestedId}\nPW: 000000`);
      onSuccess();
    } else { 
      alert(result.error || '登録エラーが発生しました'); 
    }
    setIsProcessing(false);
  };

  return (
    <section className="p-6 rounded-[40px] shadow-2xl bg-white border-2 border-pink-100 animate-in zoom-in-95 duration-300">
      <form onSubmit={handleRegister} className="space-y-6">
        <div className="bg-slate-900 rounded-[30px] p-6 shadow-inner relative">
          <Sparkles className="absolute right-4 top-4 text-pink-500 opacity-50" size={20} />
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Assigning Login ID</label>
          <div className="flex items-baseline gap-1">
            <span className="text-slate-400 text-3xl font-mono font-black">{activeShopId}</span>
            <span className="text-pink-300 text-3xl font-mono font-black">0</span>
            <span className="text-pink-500 text-4xl font-mono font-black tracking-widest">{suggestedId.slice(-4) || '....'}</span>
          </div>
        </div>

        <div className="relative">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            value={newCastName} 
            onChange={(e) => setNewCastName(e.target.value)} 
            placeholder="源氏名を入力" 
            required 
            className="w-full h-16 bg-gray-50 border-2 border-transparent focus:border-pink-200 focus:bg-white rounded-[24px] pl-14 pr-6 font-black text-lg outline-none transition-all" 
          />
        </div>

        <button 
          type="submit" 
          disabled={isProcessing || !suggestedId} 
          className="w-full h-18 bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-xl active:scale-95 transition-all disabled:opacity-30 text-sm flex justify-center items-center gap-3 hover:bg-pink-600"
        >
          {isProcessing ? <RefreshCw className="animate-spin" /> : (
            <>
              <UserPlus size={18} />
              <span>キャストを登録する</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}