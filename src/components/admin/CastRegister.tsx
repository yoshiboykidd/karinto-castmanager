'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { createCast } from '@/app/(admin)/admin/actions';
import { UserPlus, RefreshCw, Hash, User } from 'lucide-react';

interface CastRegisterProps {
  role: string;
  myShopId: string | null;
  targetShopId: string;
  onSuccess: () => void;
}

export default function CastRegister({ role, myShopId, targetShopId, onSuccess }: CastRegisterProps) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [newCastName, setNewCastName] = useState('');
  const [personalSeq, setPersonalSeq] = useState(''); // 下4桁の連番
  const [isProcessing, setIsProcessing] = useState(false);
  const [registerStatus, setRegisterStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const activeShopId = role === 'developer' ? targetShopId : (myShopId || '');

  // 📍 8桁自動採番 (店舗3桁 + キャスト識別 '0' + 連番4桁)
  useEffect(() => {
    async function calculateNextNumber() {
      if (!activeShopId || activeShopId === 'all') return;

      // 店舗コード(3桁) + キャスト識別(0) で始まるIDを検索
      const prefix = `${activeShopId}0`;
      
      const { data } = await supabase
        .from('cast_members')
        .select('login_id')
        .like('login_id', `${prefix}%`)
        .order('login_id', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        // 例: 00600005 が見つかったら、末尾の 0005 を数値化して +1
        const lastFullId = data[0].login_id;
        const lastSeqNum = parseInt(lastFullId.slice(-4)); 
        setPersonalSeq(String(lastSeqNum + 1).padStart(4, '0'));
      } else {
        // その店舗で最初のキャストなら 0001
        setPersonalSeq('0001');
      }
    }
    calculateNextNumber();
  }, [activeShopId, supabase, registerStatus]);

  const handleRegisterCast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeShopId === 'all' || !personalSeq) return;

    setIsProcessing(true);
    setRegisterStatus(null);

    // 📍 8桁を組み立て: 店舗3桁 + キャスト識別'0' + 連番4桁
    const fullLoginId = `${activeShopId}0${personalSeq}`;

    const formData = new FormData();
    formData.append('display_name', newCastName);
    formData.append('personal_number', fullLoginId); // 合体した8桁を送信
    formData.append('home_shop_id', activeShopId);

    const result = await createCast(formData);

    if (result.error) {
      setRegisterStatus({ msg: result.error, type: 'error' });
    } else if (result.success) {
      setRegisterStatus({ 
        msg: `登録完了 ✨\nID: ${fullLoginId}\nPW: 0000`, 
        type: 'success' 
      });
      setNewCastName('');
      setTimeout(() => onSuccess(), 1500);
    }
    setIsProcessing(false);
  };

  return (
    <section className="p-6 rounded-[30px] shadow-xl bg-white border-2 border-pink-100 relative overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-purple-300"></div>
      
      <h2 className="text-sm font-black text-pink-500 mb-6 flex items-center">
        <span className="mr-2 text-lg">👩🏻‍💼</span> キャスト新規登録
      </h2>

      <form onSubmit={handleRegisterCast} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">連番 (下4桁)</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300" size={14} />
              <input
                type="text"
                value={personalSeq}
                onChange={(e) => setPersonalSeq(e.target.value)}
                className="w-full bg-pink-50 border border-pink-100 rounded-xl pl-9 pr-3 py-3 text-sm font-black text-pink-600 focus:outline-none font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">表示名 (源氏名)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
              <input
                type="text"
                value={newCastName}
                onChange={(e) => setNewCastName(e.target.value)}
                placeholder="かりん"
                className="w-full bg-pink-50 border border-pink-100 rounded-xl pl-9 pr-3 py-3 text-sm font-black text-gray-700 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* 8桁プレビュー表示 */}
        <div className="bg-gray-900 rounded-2xl p-4 text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Registration Preview</p>
          <p className="text-white font-mono font-black text-2xl tracking-tighter">
            {activeShopId}<span className="text-blue-400">0</span><span className="text-pink-500">{personalSeq || '----'}</span>
          </p>
          <p className="text-[9px] text-gray-400 mt-2 font-bold italic">
            ※ 4文字目を「0」に固定し、管理者(9)との重複を防いでいます
          </p>
        </div>

        <button
          type="submit"
          disabled={isProcessing || activeShopId === 'all'}
          className="w-full bg-gray-800 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 text-xs flex justify-center items-center gap-2"
        >
          {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'キャストとして登録を確定 ⚡️'}
        </button>

        {registerStatus && (
          <div className={`text-xs font-bold p-4 rounded-xl mt-2 whitespace-pre-line leading-relaxed border animate-in slide-in-from-top-1 ${
            registerStatus.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {registerStatus.msg}
          </div>
        )}

        <p className="text-[10px] text-center text-gray-300">
          初期PW: 0000 / ログイン用: {activeShopId}0{personalSeq}@kcm-internal.jp
        </p>
      </form>
    </section>
  );
}