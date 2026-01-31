import { createClient } from '@supabase/supabase-js';

// .env.local に書いた鍵を読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 補助ツールを使わず、Supabaseの本体機能で直接窓口を作ります
export const supabase = createClient(supabaseUrl, supabaseAnonKey);