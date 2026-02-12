'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { createCast } from '@/app/(admin)/admin/actions';

export default function CastRegister({ targetShopId }: { targetShopId: string }) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [newCastName, setNewCastName] = useState('');
  const [newCastNumber, setNewCastNumber] = useState(''); // ここを自動で5桁にする
  const [registerStatus, setRegisterStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 📍 自動で「次の5桁番号」を計算してセットするロジック
  useEffect(() => {
    async function calculateNextNumber() {
      if (!targetShopId || targetShopId === 'all') return;

      const { data } = await supabase
        .from('cast_members')
        .select('login_id')
        .eq('home_shop_id', targetShopId)
        .eq('role', 'cast');

      if (data && data.length > 0) {
        const numbers = data.map(c => parseInt(c.login_id.slice(-5))).filter(n => !isNaN(n));
        const maxNum = Math.max(0, ...numbers);
        // 📍 5桁の文字列（00001形式）に変換してセット
        setNewCastNumber(String(maxNum + 1).padStart(5, '0'));
      } else {
        setNewCastNumber('00001'); // 最初の1人目
      }
    }
    calculateNextNumber();
  }, [targetShopId, supabase, registerStatus]);

  const handleRegisterCast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setRegisterStatus(null);

    const formData = new FormData();
    formData.append('display_name', newCastName);
    formData.append('personal_number', newCastNumber); // 5桁の文字列として送信
    formData.append('home_shop_id', targetShopId);

    const result = await createCast(formData);

    if (result.error) {
      setRegisterStatus({ msg: result.error, type: 'error' });
    } else if (result.success) {
      setRegisterStatus({ msg: `${newCastName}さんを登録しました！\nID: ${targetShopId}${newCastNumber}\nPW: 0000`, type: 'success' });
      setNewCastName('');
      // 番号は useEffect で次の番号が自動セットされる
    }
    setIsProcessing(false);
  };

  return (
    <section className="p-6 rounded-[30px] shadow-xl bg-white border-2 border-pink-100 relative overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-purple-300"></div>
      <h2 className="text-sm font-black text-pink-500 mb-4 flex items-center">
        <span className="mr-2 text-lg">👩🏻‍💼</span> 新人キャスト登録
      </h2>

      <form onSubmit={handleRegisterCast} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">個人番号 (5桁)</label>
            <input
              type="text"
              value={newCastNumber}
              onChange={(e) => setNewCastNumber(e.target.value)}
              placeholder="00001"
              className="w-full bg-pink-50 border border-pink-100 rounded-xl px-3 py-3 text-sm font-black text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300 font-mono"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">表示名 (源氏名)</label>
            <input
              type="text"
              value={newCastName}
              onChange={(e) => setNewCastName(e.target.value)}
              placeholder="例: ハナコ"
              className="w-full bg-pink-50 border border-pink-100 rounded-xl px-3 py-3 text-sm font-black text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
              required
            />
          </div>
        </div>

        {/* 📍 登録される8桁IDを視覚的に見せる */}
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-dashed border-gray-200">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Login ID Preview</p>
          <p className="text-lg font-black text-gray-800 tracking-tighter">
            {targetShopId}<span className="text-pink-500">{newCastNumber}</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={isProcessing || targetShopId === 'all'}
          className="w-full bg-gray-800 text-white font-black py-4 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 text-xs"
        >
          {isProcessing ? '通信中...' : 'この内容で登録を確定 ⚡️'}
        </button>

        {registerStatus && (
          <div className={`text-xs font-bold p-3 rounded-xl mt-2 whitespace-pre-line leading-relaxed ${registerStatus.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {registerStatus.msg}
          </div>
        )}
        
        <p className="text-[10px] text-center text-gray-300 mt-2">
          ※初期パスワードは「0000」で登録されます
        </p>
      </form>
    </section>
  );
}