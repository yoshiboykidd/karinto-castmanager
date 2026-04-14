'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function UserDashboard() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      const userData = JSON.parse(session);
      setUser(userData);
      
      // 店舗ごとの会員番号を取得
      supabase
        .from('customer_memberships')
        .select('*')
        .eq('user_id', userData.id)
        .then(({ data }) => setMemberships(data || []));
    }
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm">
        <p className="text-[11px] font-black text-pink-400 uppercase mb-1">Welcome</p>
        <h1 className="text-2xl font-black text-gray-800">{user.display_name} 様</h1>
      </header>

      <main className="p-6 space-y-6">
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h2 className="text-[11px] font-black text-gray-400 mb-4 uppercase tracking-widest">My IDs</h2>
          <div className="space-y-3">
            {memberships.map((m) => (
              <div key={m.id} className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="font-bold text-gray-600">{m.shop_id}店</span>
                <span className="font-black text-lg text-gray-800">#{m.shop_member_no}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md px-10 py-6 flex justify-around rounded-t-[32px] border-t border-gray-100">
        <span className="text-2xl">🏠</span>
        <span className="text-2xl opacity-20">📅</span>
        <span className="text-2xl opacity-20">👤</span>
      </nav>
    </div>
  );
}