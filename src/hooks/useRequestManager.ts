import { useState, useCallback } from 'react';
import { format } from 'date-fns';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1467395577829523487/oQUEYdVA4oSbkAb53WYNMCnVIiOa0Tsi25WRPVWDtxF2UsnJFGrsU_gb-qG37gdyTQaQ";

// ★修正: shifts: any[] を shifts: any に変更 (null対策)
export function useRequestManager(
  supabase: any, 
  profile: any, 
  shifts: any, // ← ここを any に変更！
  selectedMulti: Date[] = [], 
  refreshData: () => void, 
  resetSelection: () => void
) {
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});

  const handleBulkSubmit = useCallback(async () => {
    // profile または shifts が揃っていない場合は実行させない
    // ★修正: shiftsの配列チェックを Array.isArray で安全に行う
    if (!profile || !profile.login_id || !Array.isArray(shifts) || selectedMulti.length === 0) {
      alert('申請するデータが正しく読み込まれていません。');
      return;
    }
    
    try {
      const requests = selectedMulti.map(date => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return null;

        const key = format(date, 'yyyy-MM-dd');
        // ★修正: shiftsが配列であることを確認してからfind
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        const existing = safeShifts.find((s: any) => s.shift_date === key);

        return {
          login_id: profile.login_id,
          hp_display_name: profile.display_name || 'キャスト',
          shift_date: key,
          start_time: requestDetails[key]?.s || '11:00',
          end_time: requestDetails[key]?.e || '23:30',
          status: 'requested',
          is_official: false,
          is_official_pre_exist: existing?.is_official_pre_exist || existing?.status === 'official' || false
        };
      }).filter(r => r !== null);

      if (requests.length === 0) return;

      const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
      
      if (!error) {
        fetch(DISCORD_WEBHOOK_URL, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `🔔 シフト申請: **${profile.display_name}** (${requests.length}件)` }) 
        }).catch(err => console.error("Webhook Error:", err));
        
        alert('申請を送信しました！🚀');
        resetSelection(); 
        refreshData();    
      } else {
        throw error;
      }
    } catch (err: any) {
      alert('送信に失敗しました。');
      console.error("Submit Error:", err);
    }
  }, [profile, shifts, selectedMulti, requestDetails, supabase, refreshData, resetSelection]);

  return { requestDetails, setRequestDetails, handleBulkSubmit };
}