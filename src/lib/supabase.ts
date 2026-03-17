import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// ⚠️ DEV MODE: Dùng service_role key để bypass RLS trong giai đoạn phát triển
// 🔴 PRODUCTION: Phải chuyển sang VITE_SUPABASE_ANON_KEY + implement Supabase Auth thật
// Lý do: App đang dùng mock user (AuthContext), chưa signIn Supabase Auth
// → anon key bị RLS chặn → trả về [] cho mọi bảng
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY 
  || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu Supabase URL hoặc Key trong biến môi trường (.env)');
}

console.log('[Supabase] Khởi tạo client:', {
  url: supabaseUrl,
  keyType: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE (dev)' : 'ANON',
});

export const supabase = createClient(supabaseUrl, supabaseKey);
