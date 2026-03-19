import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Shield, Users, User, CheckCircle, XCircle } from 'lucide-react';
import UserFormModal, { UserFormData } from './UserFormModal';

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  avatar_initials: string;
  available_roles: string[];
  active_role: string;
  phone: string | null;
  status: 'active' | 'inactive';
  employee_code: string | null;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  sales_manager: 'Quản lý',
  sales_rep: 'Nhân viên',
};

const ROLE_ICON: Record<string, React.ElementType> = {
  admin: Shield,
  sales_manager: Users,
  sales_rep: User,
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.employee_code ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const callEdgeFunction = async (method: string, body: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? 'Lỗi không xác định');
    return result;
  };

  const handleSave = async (form: UserFormData) => {
    try {
      if (editing) {
        await callEdgeFunction('PUT', { userId: editing.id, ...form });
        toast.success('Cập nhật người dùng thành công');
      } else {
        await callEdgeFunction('POST', form);
        toast.success('Tạo tài khoản thành công');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
  };

  const handleDelete = async (user: ProfileRow) => {
    if (!confirm(`Xóa tài khoản "${user.name}"? Thao tác này không thể hoàn tác.`)) return;
    setDeletingId(user.id);
    try {
      await callEdgeFunction('DELETE', { userId: user.id });
      toast.success('Đã xóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Quản lý người dùng
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {users.length} tài khoản
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, email, mã nhân viên..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {isLoading ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Không tìm thấy người dùng nào
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                {['Người dùng', 'Mã NV', 'Vai trò', 'Trạng thái', 'Số điện thoại', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--muted-foreground)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const RoleIcon = ROLE_ICON[u.active_role] ?? User;
                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-gray-50/50"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ backgroundColor: 'var(--primary)' }}
                        >
                          {u.avatar_initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {u.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Employee code */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {u.employee_code ?? '—'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        <RoleIcon size={12} />
                        {ROLE_LABEL[u.active_role] ?? u.active_role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                          <CheckCircle size={13} /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                          <XCircle size={13} /> Ngừng hoạt động
                        </span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {u.phone ?? '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditing(u); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600 disabled:opacity-40"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <UserFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
