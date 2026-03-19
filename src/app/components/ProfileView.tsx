import { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useTasks } from '../../hooks/useTasks';
import { useSLAData } from '../../hooks/useSLAData';
import { useNavigationStore } from '../../hooks/useNavigation';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  User, Mail, Phone, Building, Calendar, Shield, Key,
  Target, Medal, CheckCircle2, Camera, MapPin, Clock,
  Briefcase, ExternalLink, MessageSquare, Award, Loader2, Eye, EyeOff,
} from 'lucide-react';

export function ProfileView() {
  const { user, activeRole, refreshProfile } = useAuth();
  const { setActiveTab: setAppTab } = useNavigationStore();
  const [activeTab, setActiveTab] = useState<'info' | 'performance' | 'security'>('info');

  // ── Info form state ──────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingInfo, setSavingInfo] = useState(false);

  // ── Security form state ──────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const { data: statsData } = useDashboardStats();
  const { tasks } = useTasks();
  const { stats: slaStats } = useSLAData();

  if (!user) return null;

  // ── Performance data ─────────────────────────────────────────────────────
  const myPerf = statsData?.employeePerformance.find(p => p.email === user.email)
    ?? statsData?.employeePerformance[0];
  const target = myPerf?.targetMonthly || 0;
  const actual = myPerf?.actualRevenue || 0;
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const dealsCount = myPerf?.dealsCount || 0;
  const slaRate = slaStats?.slaComplianceRate ?? 100;
  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const openTasks = tasks.filter(t => t.status !== 'done').length;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'sales_manager': return 'Quản lý';
      case 'sales_rep': return 'Nhân viên';
      default: return '';
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!name.trim()) { toast.error('Tên không được để trống'); return; }
    setSavingInfo(true);
    try {
      const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), phone: phone.trim() || null, avatar_initials: initials, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Cập nhật thông tin thành công');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setPwdError('');
    if (newPassword.length < 6) { setPwdError('Mật khẩu ít nhất 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Mật khẩu xác nhận không khớp'); return; }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        // Supabase trả AuthError — lấy message trực tiếp
        setPwdError(translatePwdError(error.message));
        return;
      }
      toast.success('Đổi mật khẩu thành công');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setSavingPwd(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 h-full bg-[#f0f2f5] overflow-y-auto w-full pb-12">
      {/* HERO BANNER */}
      <div className="relative h-64 w-full bg-gradient-to-br from-blue-800 via-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-gradient-to-t from-[#f0f2f5] to-transparent" />
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden border border-white/50">
              <div className="p-8 text-center border-b border-gray-50">
                {/* Avatar */}
                <div className="relative inline-block mb-6 group">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 shadow-2xl transform transition-transform group-hover:scale-105">
                    <div className="w-full h-full rounded-[1.2rem] bg-indigo-900 flex items-center justify-center text-white text-4xl font-black shadow-inner">
                      {user.avatar}
                    </div>
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 text-blue-600 hover:text-blue-700 transition-all hover:scale-110 active:scale-95">
                    <Camera size={18} strokeWidth={2.5} />
                  </button>
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user.name}</h2>
                <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mt-2">
                  {getRoleLabel(activeRole)}
                </p>

                {/* Stats */}
                <div className="mt-8 flex justify-center gap-6">
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{dealsCount}</p>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Deals</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100" />
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{slaRate.toFixed(0)}%</p>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">SLA</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100" />
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{openTasks}</p>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Nhiệm vụ</p>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="p-6 space-y-4">
                <InfoRow icon={<Mail size={16} />}>{user.email}</InfoRow>
                {user.phone && <InfoRow icon={<Phone size={16} />}>{user.phone}</InfoRow>}
                <InfoRow icon={<MapPin size={16} />}>PGL Hub, Hà Nội</InfoRow>
                {user.employee_code && (
                  <InfoRow icon={<User size={16} />}>Mã NV: {user.employee_code}</InfoRow>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Medal size={16} className="text-yellow-500" /> Huy chương đạt được
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '⭐ Chốt Deal Nhanh', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                  { label: '🚀 Siêu Anh Hùng SLA', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: '🤝 Chăm Sóc Tận Tâm', cls: 'bg-green-50 text-green-700 border-green-200' },
                ].map(b => (
                  <span key={b.label} className={`px-3 py-1.5 border rounded-xl text-[10px] font-black shadow-sm ${b.cls}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Tabs + Activity */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden border border-white/50">

              {/* Tab nav */}
              <div className="flex items-center px-4 pt-4 border-b border-gray-50">
                {(['info', 'performance', 'security'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                      activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {{ info: 'Thông tin', performance: 'Hiệu suất', security: 'Bảo mật' }[tab]}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-8">

                {/* ── TAB: THÔNG TIN ── */}
                {activeTab === 'info' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Họ và tên</Label>
                        <FieldWrap icon={<User size={18} />}>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className={fieldCls}
                          />
                        </FieldWrap>
                      </div>

                      <div className="space-y-2">
                        <Label>Email</Label>
                        <FieldWrap icon={<Mail size={18} />}>
                          <input type="text" value={user.email} disabled className={disabledCls} />
                        </FieldWrap>
                      </div>

                      <div className="space-y-2">
                        <Label>Số điện thoại</Label>
                        <FieldWrap icon={<Phone size={18} />}>
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="0912 345 678"
                            className={fieldCls}
                          />
                        </FieldWrap>
                      </div>

                      <div className="space-y-2">
                        <Label>Mã nhân viên</Label>
                        <FieldWrap icon={<User size={18} />}>
                          <input type="text" value={user.employee_code ?? '—'} disabled className={disabledCls} />
                        </FieldWrap>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Phòng ban</Label>
                        <FieldWrap icon={<Building size={18} />}>
                          <input type="text" value="Ban Kinh doanh & PTTT" disabled className={disabledCls} />
                        </FieldWrap>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                      <button
                        onClick={handleSaveInfo}
                        disabled={savingInfo}
                        className="px-10 py-4 bg-[#1e40af] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
                      >
                        {savingInfo ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Lưu thay đổi
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB: HIỆU SUẤT ── */}
                {activeTab === 'performance' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <Target className="text-blue-200" size={24} />
                          <h4 className="text-sm font-black uppercase tracking-widest text-blue-100">Chỉ tiêu tháng này</h4>
                        </div>
                        <div className="flex items-baseline gap-4 mb-8">
                          <span className="text-5xl font-black">{(actual / 1_000_000_000).toFixed(1)} tỷ ₫</span>
                          <span className="text-blue-200 font-bold opacity-70">/ {(target / 1_000_000_000).toFixed(1)} tỷ ₫</span>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden p-1">
                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                            <span>Tiến độ: {pct.toFixed(0)}%</span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} /> Còn lại {daysLeft} ngày
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <StatCard icon={<CheckCircle2 size={20} />} iconColor="text-green-600" label="Deals đang quản lý">
                        {dealsCount} deals
                      </StatCard>
                      <StatCard
                        icon={<Clock size={20} />}
                        iconColor="text-blue-600"
                        label="Tỷ lệ SLA tuân thủ"
                        badge={slaRate >= 90 ? 'Tốt' : slaRate >= 70 ? 'Trung bình' : 'Cần cải thiện'}
                      >
                        {slaRate.toFixed(1)}%
                      </StatCard>
                    </div>
                  </div>
                )}

                {/* ── TAB: BẢO MẬT ── */}
                {activeTab === 'security' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-lg">
                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <div className="mt-1 text-blue-600"><Shield size={24} /></div>
                      <div>
                        <h4 className="text-sm font-black text-blue-900 mb-1">Bảo mật tài khoản</h4>
                        <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                          Để đảm bảo an toàn cho dữ liệu khách hàng, vui lòng đổi mật khẩu định kỳ 6 tháng một lần.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label>Mật khẩu mới</Label>
                        <FieldWrap icon={<Key size={18} />} suffix={
                          <button type="button" onClick={() => setShowNew(v => !v)} className="text-gray-400 hover:text-gray-600">
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }>
                          <input
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => { setNewPassword(e.target.value); setPwdError(''); }}
                            placeholder="••••••••"
                            className={`${fieldCls} font-mono`}
                            autoComplete="new-password"
                            required
                            minLength={6}
                          />
                        </FieldWrap>
                      </div>

                      <div className="space-y-2">
                        <Label>Xác nhận mật khẩu</Label>
                        <FieldWrap icon={<Key size={18} />} suffix={
                          <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-400 hover:text-gray-600">
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }>
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => { setConfirmPassword(e.target.value); setPwdError(''); }}
                            placeholder="••••••••"
                            className={`${fieldCls} font-mono`}
                            autoComplete="new-password"
                            required
                            minLength={6}
                          />
                        </FieldWrap>
                      </div>

                      {/* Password strength */}
                      {newPassword && (
                        <div className="space-y-1.5">
                          <div className="flex gap-1">
                            {[1,2,3,4].map(lvl => (
                              <div key={lvl} className={`h-1.5 flex-1 rounded-full transition-colors ${
                                passwordStrength(newPassword) >= lvl
                                  ? lvl <= 1 ? 'bg-red-400' : lvl <= 2 ? 'bg-yellow-400' : lvl <= 3 ? 'bg-blue-400' : 'bg-green-500'
                                  : 'bg-gray-100'
                              }`} />
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 font-medium">
                            {['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][passwordStrength(newPassword)]}
                          </p>
                        </div>
                      )}

                      {pwdError && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                          {pwdError}
                        </p>
                      )}

                      <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <button
                          type="submit"
                          disabled={savingPwd || !newPassword || !confirmPassword}
                          className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                          {savingPwd && <Loader2 size={14} className="animate-spin" />}
                          Cập nhật mật khẩu
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-8 border border-white/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" /> Hoạt động gần đây
                </h3>
                <button
                  onClick={() => setAppTab('tasks')}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Xem tất cả <ExternalLink size={10} />
                </button>
              </div>
              <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
                {ACTIVITIES.map((act) => (
                  <div key={act.id} className="relative pl-12 flex gap-4">
                    <div className="absolute left-0 top-0 w-9 h-9 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-center z-10 transition-transform hover:scale-110">
                      {act.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{act.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400">{act.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function translatePwdError(msg: string): string {
  if (msg.includes('New password should be different')) return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  if (msg.includes('Password should be at least')) return 'Mật khẩu phải ít nhất 6 ký tự.';
  if (msg.includes('weak')) return 'Mật khẩu quá yếu, hãy thêm chữ hoa và số.';
  if (msg.includes('reauthentication')) return 'Phiên đăng nhập hết hạn, vui lòng đăng xuất và đăng nhập lại.';
  return msg;
}

function passwordStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const fieldCls = 'w-full pl-12 pr-4 py-3.5 bg-transparent border-0 outline-none text-sm font-bold text-gray-900 focus:ring-0';
const disabledCls = 'w-full pl-12 pr-4 py-3.5 bg-transparent border-0 outline-none text-sm font-bold text-gray-400 cursor-not-allowed';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] ml-1 block">{children}</label>;
}

function FieldWrap({ icon, suffix, children }: { icon: React.ReactNode; suffix?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative group flex items-center bg-gray-50/50 border border-gray-100 rounded-2xl focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all">
      <span className="absolute left-4 text-gray-300 group-focus-within:text-blue-500 transition-colors pointer-events-none">
        {icon}
      </span>
      {children}
      {suffix && <span className="absolute right-4">{suffix}</span>}
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-gray-600 group hover:text-blue-600 transition-colors cursor-default">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors group-hover:bg-blue-50">
        {icon}
      </div>
      <span className="text-xs font-bold truncate">{children}</span>
    </div>
  );
}

function StatCard({ icon, iconColor, label, badge, children }: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 bg-white rounded-xl shadow-sm ${iconColor}`}>{icon}</div>
        {badge && (
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{children}</p>
    </div>
  );
}

const ACTIVITIES = [
  { id: 1, title: 'Hoàn thành hợp đồng #1204', time: '2 giờ trước', description: 'Cty Gotech - 1.5 tỷ ₫', icon: <Briefcase size={14} className="text-blue-600" /> },
  { id: 2, title: 'Phản hồi nhóm Zalo', time: '5 giờ trước', description: 'PG - Cty Phúc Hà', icon: <MessageSquare size={14} className="text-green-600" /> },
  { id: 3, title: 'Nhận huy chương "Chốt deal nhanh"', time: 'Hôm qua', description: 'SLA phản hồi dưới 15 phút', icon: <Award size={14} className="text-yellow-600" /> },
  { id: 4, title: 'Cập nhật nhiệm vụ', time: '2 ngày trước', description: 'Gửi báo giá cho Cty Minh Anh', icon: <CheckCircle2 size={14} className="text-indigo-600" /> },
];
