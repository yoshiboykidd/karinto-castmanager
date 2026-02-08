import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log("🚀 緊急メンテナンスモード: ID修正を開始...");

    // 1. キャスト名簿のIDを強制的に「8桁」にする
    const { data: members } = await supabase.from('cast_members').select('id, login_id');
    let fixedCount = 0;
    
    for (const member of members || []) {
      const currentId = String(member.login_id).trim();
      const newId = currentId.padStart(8, '0'); // 00600037形式に
      
      if (currentId !== newId) {
        await supabase.from('cast_members').update({ login_id: newId }).eq('id', member.id);
        fixedCount++;
      }
    }
    log(`✅ 名簿修正完了: ${fixedCount}件のIDを8桁に統一しました`);

    // 2. シフトテーブルの「未来のデータ」を全削除（きれいな状態で再取得するため）
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('shifts').delete().gte('shift_date', today);
    log(`🧹 未来のシフトをリセットしました`);

    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}