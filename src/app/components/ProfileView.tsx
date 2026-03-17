import { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useTasks } from '../../hooks/useTasks';
import { useSLAData } from '../../hooks/useSLAData';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  Key,
  Target,
  Medal,
  CheckCircle2,
  Camera,
  MapPin,
  Clock,
  Briefcase,
  ExternalLink,
  MessageSquare,
  Award
} from 'lucide-react';

export function ProfileView() {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'performance' | 'security'>('info');

  const { data: statsData } = useDashboardStats();
  const { tasks } = useTasks();
  const { stats: slaStats } = useSLAData();

  if (!user) return null;

  // Match current user performance from Supabase by email
  const myPerformance = statsData?.employeePerformance.find(p => p.email === user.email)
    ?? statsData?.employeePerformance[0];

  const target = myPerformance?.targetMonthly || 0;
  const actual = myPerformance?.actualRevenue || 0;
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const dealsCount = myPerformance?.dealsCount || 0;
  const slaRate = slaStats?.slaComplianceRate ?? 100;

  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = lastDay.getDate() - now.getDate();

  const openTasks = tasks.filter(t => t.status !== 'done').length;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'sales_manager': return 'Quản lý';
      case 'sales_rep': return 'Nhân viên';
      default: return '';
    }
  };

  return (
    <div className="flex-1 h-full bg-[#f0f2f5] overflow-y-auto w-full pb-12">
      {/* ── HERO BANNER ── */}
      <div className="relative h-64 w-full bg-gradient-to-br from-blue-800 via-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-gradient-to-t from-[#f0f2f5] to-transparent" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: PROFILE CARD */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden border border-white/50 backdrop-blur-sm">
              <div className="p-8 text-center border-b border-gray-50">
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

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 text-gray-600 group hover:text-blue-600 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors group-hover:bg-blue-50">
                    <Mail size={16} />
                  </div>
                  <span className="text-xs font-bold truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-4 text-gray-600 group hover:text-blue-600 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors group-hover:bg-blue-50">
                    <MapPin size={16} />
                  </div>
                  <span className="text-xs font-bold">PGL Hub, Hà Nội</span>
                </div>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Medal size={16} className="text-yellow-500" /> Huy chương đạt được
              </h3>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-sm">
                  ⭐ Chốt Deal Nhanh
                </div>
                <div className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-sm">
                  🚀 Siêu Anh Hùng SLA
                </div>
                <div className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-sm">
                  🤝 Chăm Sóc Tận Tâm
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILS & TABS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden border border-white/50">

              {/* Tabs Navigation */}
              <div className="flex items-center px-4 pt-4 border-b border-gray-50">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                    activeTab === 'info' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Thông tin
                  {activeTab === 'info' && <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                    activeTab === 'performance' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Hiệu suất
                  {activeTab === 'performance' && <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                    activeTab === 'security' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Bảo mật
                  {activeTab === 'security' && <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full" />}
                </button>
              </div>

              <div className="p-8">
                {/* TAB: INFO */}
                {activeTab === 'info' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] ml-1 text-xs">Họ và tên</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                          <input type="text" defaultValue={user.name} className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] ml-1 text-xs">Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                          <input type="text" defaultValue={user.email} disabled className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-gray-400 outline-none cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] ml-1 text-xs">Phòng ban</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                          <input type="text" defaultValue="Ban Kinh doanh & PTTT" disabled className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-gray-400 outline-none cursor-not-allowed" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                      <button className="px-10 py-4 bg-[#1e40af] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Lưu thay đổi
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB: PERFORMANCE */}
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
                          <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden p-1 backdrop-blur-md">
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
                      <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-white rounded-xl shadow-sm text-green-600">
                            <CheckCircle2 size={20} />
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deals đang quản lý</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{dealsCount} deals</p>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                            <Clock size={20} />
                          </div>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {slaRate >= 90 ? 'Tốt' : slaRate >= 70 ? 'Trung bình' : 'Cần cải thiện'}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tỷ lệ SLA tuân thủ</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{slaRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: SECURITY */}
                {activeTab === 'security' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-lg">
                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <div className="mt-1 text-blue-600">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-blue-900 mb-1">Bảo mật tài khoản</h4>
                        <p className="text-xs text-blue-700/70 font-medium leading-relaxed">Để đảm bảo an toàn cho dữ liệu khách hàng, vui lòng đổi mật khẩu định kỳ 6 tháng một lần.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] ml-1">Mật khẩu mới</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                          <input type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all font-mono" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] ml-1">Xác nhận mật khẩu</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                          <input type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all font-mono" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                      <button className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">
                        Cập nhật mật khẩu
                      </button>
                    </div>
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
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                  Xem tất cả <ExternalLink size={10} />
                </button>
              </div>

              <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
                {[
                  { id: 1, title: 'Hoàn thành hợp đồng #1204', time: '2 giờ trước', description: 'Cty Gotech - 1.5 tỷ ₫', icon: <Briefcase size={14} className="text-blue-600" /> },
                  { id: 2, title: 'Phản hồi nhóm Zalo', time: '5 giờ trước', description: 'PG - Cty Phúc Hà', icon: <MessageSquare size={14} className="text-green-600" /> },
                  { id: 3, title: 'Nhận huy chương "Chốt deal nhanh"', time: 'Hôm qua', description: 'SLA phản hồi dưới 15 phút', icon: <Award size={14} className="text-yellow-600" /> },
                  { id: 4, title: 'Cập nhật nhiệm vụ', time: '2 ngày trước', description: 'Gửi báo giá cho Cty Minh Anh', icon: <CheckCircle2 size={14} className="text-indigo-600" /> },
                ].map((act) => (
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
