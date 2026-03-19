/**
 * Edge Function: admin-user
 * - POST /admin-user        → tạo user mới
 * - PUT  /admin-user        → cập nhật user
 * - DELETE /admin-user      → xóa user
 *
 * Chỉ admin mới được gọi. Service role key chạy server-side, không bao giờ ra client.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── Xác thực caller ──────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Dùng anon key + JWT caller để lấy user info
  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) return json({ error: 'Unauthorized' }, 401);

  // Kiểm tra admin role — dùng service role để tránh vòng lặp RLS
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('available_roles')
    .eq('id', caller.id)
    .single();

  if (!callerProfile?.available_roles?.includes('admin')) {
    return json({ error: 'Forbidden: chỉ admin được thực hiện thao tác này' }, 403);
  }

  // ── Xử lý theo method ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    // Tạo user mới
    const body = await req.json();
    const { email, password, name, phone, role, status, employee_code } = body;

    if (!email || !password || !name) {
      return json({ error: 'email, password và name là bắt buộc' }, 400);
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError) return json({ error: createError.message }, 400);

    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: newUser.user.id,
      name,
      email,
      avatar_initials: initials,
      available_roles: [role ?? 'sales_rep'],
      active_role: role ?? 'sales_rep',
      phone: phone ?? null,
      status: status ?? 'active',
      employee_code: employee_code ?? null,
    });

    if (profileError) return json({ error: profileError.message }, 400);

    return json({ success: true, userId: newUser.user.id });
  }

  if (req.method === 'PUT') {
    // Cập nhật user
    const body = await req.json();
    const { userId, name, phone, role, status, employee_code, password } = body;

    if (!userId) return json({ error: 'userId là bắt buộc' }, 400);

    // Đổi password nếu có
    if (password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
    }

    const profileUpdate: Record<string, unknown> = {};
    if (name !== undefined) {
      profileUpdate.name = name;
      profileUpdate.avatar_initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    }
    if (phone !== undefined) profileUpdate.phone = phone;
    if (role !== undefined) {
      profileUpdate.available_roles = [role];
      profileUpdate.active_role = role;
    }
    if (status !== undefined) profileUpdate.status = status;
    if (employee_code !== undefined) profileUpdate.employee_code = employee_code;
    profileUpdate.updated_at = new Date().toISOString();

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (profileError) return json({ error: profileError.message }, 400);

    return json({ success: true });
  }

  if (req.method === 'DELETE') {
    const body = await req.json();
    const { userId } = body;

    if (!userId) return json({ error: 'userId là bắt buộc' }, 400);
    if (userId === caller.id) return json({ error: 'Không thể tự xóa tài khoản của mình' }, 400);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return json({ error: error.message }, 400);

    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, 405);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
