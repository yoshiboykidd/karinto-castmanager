import { useState, useEffect, useMemo } from 'react';
import { format, isAfter, startOfToday } from 'date-fns';

// ★修正点: shifts の型を any[] から any に変更 (nullが来ても怒られないようにする)
export function useAchievement(
  supabase: any, 
  profile: any, 
  shifts: any, // ← ここを any に変更
  selectedSingle: Date | undefined, 
  refreshData: () => void
) {
  // 実績入力用の状態
  const [editReward, setEditReward] = useState({ f: '', first: '', main: '', amount: '' });
  
  // 1. マウント状態を管理（時刻のズレを防ぐため）
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // 選択された日付が変わったら、入力フォームの中身を同期
  useEffect(() => {
    // Array.isArrayでチェックしているので安全
    if (!selectedSingle || !Array.isArray(shifts)) return;
    
    const dateStr = format(selectedSingle, 'yyyy-MM-dd');
    const shift = shifts.find((s: any) => s.shift_date === dateStr);
    
    setEditReward({ 
      f: String(shift?.f_count || ''), 
      first: String(shift?.first_request_count || ''), 
      main: String(shift?.main_request_count || ''), 
      amount: String(shift?.reward_amount || '') 
    });
  }, [selectedSingle, shifts]);

  // その日が編集可能かどうかの判定
  const { isEditable, selectedShift } = useMemo(() => {
    // マウント前やデータがない場合は「編集不可」
    if (!mounted || !selectedSingle || !Array.isArray(shifts)) {
      return { isEditable: false, selectedShift: null };
    }

    const today = startOfToday();
    const dateStr = format(selectedSingle, 'yyyy-MM-dd');
    const shift = shifts.find((s: any) => s.shift_date === dateStr);

    const editable = !isAfter(selectedSingle, today) && 
                     shift && 
                     shift.start_time && 
                     shift.start_time !== 'OFF';

    return { isEditable: editable, selectedShift: shift };
  }, [mounted, selectedSingle, shifts]);

  // 実績保存ロジック
  const handleSaveAchievement = async () => {
    if (!selectedSingle || !profile) return;
    const dateStr = format(selectedSingle, 'yyyy-MM-dd');

    if (!selectedShift || selectedShift.start_time === 'OFF') {
      alert('HPにシフトがない日は実績を入力できません');
      return;
    }

    const { error } = await supabase.from('shifts').update({ 
      f_count: Number(editReward.f) || 0, 
      first_request_count: Number(editReward.first) || 0, 
      main_request_count: Number(editReward.main) || 0, 
      reward_amount: Number(editReward.amount) || 0,
      is_official: true 
    }).eq('login_id', profile.login_id).eq('shift_date', dateStr);
    
    if (!error) { 
      refreshData(); 
      alert('実績を保存しました💰'); 
    }
  };

  // ★ここに selectedShift が含まれているので、呼び出し元で取得できます
  return { editReward, setEditReward, handleSaveAchievement, isEditable, selectedShift };
}