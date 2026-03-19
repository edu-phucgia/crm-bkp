import { useState, useEffect } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import type { ProfileRow } from './UsersPage';

export interface UserFormData {
  email?: string;
  password?: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  employee_code: string;
}

interface Props {
  initial: ProfileRow | null;
  onSave: (data: UserFormData) => Promise<void>;
  onClose: () => void;
}

const ROLES = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'sales_manager', label: 'Quản lý' },
  { value: 'sales_rep', label: 'Nhân viên Sale' },
];

const STATUSES = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
];

export default function UserFormModal({ initial, onSave, onClose }: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [role, setRole] = useState(initial?.active_role ?? 'sales_rep');
  const [status, setStatus] = useState<string>(initial?.status ?? 'active');
  const [employeeCode, setEmployeeCode] = useState(initial?.employee_code ?? '');
  const [loading, setLoading] = useState(false);

  // Auto-generate employee code on create
  useEffect(() => {
    if (!isEdit && !employeeCode) {
      const code = 'NV' + Date.now().toString().slice(-5);
      setEmployeeCode(code);
    }
  }, []);

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: UserFormData = {
        name,
        phone,
        role,
        status,
        employee_code: employeeCode,
      };
      if (!isEdit) {
        payload.email = email;
        payload.password = password;
      } else if (password) {
        payload.password = password;
      }
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--card)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
            {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {initials !== '??' ? initials : <User size={28} />}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {name || 'Họ và tên'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {email || 'Email'}
                </p>
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Họ và tên */}
              <div className="col-span-2">
                <Label>Họ và tên <Required /></Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email <Required /></Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@company.com"
                  required={!isEdit}
                  disabled={isEdit}
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <Label>{isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : <>Mật khẩu <Required /></>}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isEdit ? 'Nhập mật khẩu mới' : 'Ít nhất 6 ký tự'}
                  required={!isEdit}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {/* Mã nhân viên */}
              <div>
                <Label>Mã nhân viên <Required /></Label>
                <Input
                  value={employeeCode}
                  onChange={e => setEmployeeCode(e.target.value)}
                  placeholder="NV001"
                  required
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  type="tel"
                />
              </div>

              {/* Vai trò */}
              <div>
                <Label>Vai trò <Required /></Label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Trạng thái */}
              <div>
                <Label>Trạng thái <Required /></Label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
      {children}
    </label>
  );
}

function Required() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)',
      }}
    />
  );
}
