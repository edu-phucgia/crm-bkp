import { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
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
  AlertCircle
} from 'lucide-react';

export function ProfileView() {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  if (!user) return null;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'sales_manager': return 'Quản lý';
      case 'sales_rep': return 'Nhân viên';
      default: return '';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'sales_manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sales_rep': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 h-full bg-[#f8fafc] overflow-y-auto w-full">
      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-10 py-10 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-[#1A4F9C]" />
        
        <div className="relative z-10 flex items-end gap-6 mt-12 max-w-5xl mx-auto">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-xl shrink-0">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-inner">
              {user.avatar}
            </div>
          </div>
          
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">
              {user.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                <Mail size={16} />
                {user.email}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                <Phone size={16} />
                0912.345.678
              </span>
            </div>
            
            {/* Roles */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[11px] font-black uppercase text-gray-400 mr-2 tracking-widest">Vai trò của bạn:</span>
              {user.availableRoles.map(role => (
                <span 
                  key={role}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(role)} ${role === activeRole ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-70'}`}
                  title={role === activeRole ? 'Vai trò đang chọn' : ''}
                >
                  {getRoleLabel(role)}
                  {role === activeRole && <CheckCircle2 size={12} className="inline-block ml-1.5 -mt-0.5" />}
                </span>
              ))}
            </div>
          </div>

          <div className="pb-2">
            <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
              <User size={16} /> Cập nhật ảnh
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-10 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('info')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'info' ? 'border-[#1A4F9C] text-[#1A4F9C]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={18} />
            Thông tin chung
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'security' ? 'border-[#1A4F9C] text-[#1A4F9C]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield size={18} />
            Bảo mật & Cài đặt
          </button>
        </div>

        {/* Tab Content: INFO */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Form Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                   Chi tiết liên hệ
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-2 tracking-widest">Họ và tên</label>
                    <input type="text" defaultValue={user.name} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-2 tracking-widest">Số điện thoại</label>
                    <input type="text" defaultValue="0912.345.678" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-2 tracking-widest">Email doanh nghiệp</label>
                    <input type="email" defaultValue={user.email} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 outline-none cursor-not-allowed" />
                    <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1"><AlertCircle size={12}/> Vui lòng liên hệ Admin để thay đổi email.</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-2 tracking-widest">Phòng ban / Đơn vị công tác</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="text" defaultValue="Ban Kinh doanh & PTTT" disabled className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 outline-none cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button className="px-8 py-3 bg-[#1A4F9C] text-white rounded-xl font-black text-sm shadow-lg shadow-blue-200/50 hover:bg-blue-700 transition-all active:scale-95">
                    Lưu thay đổi
                  </button>
                </div>
              </div>

            </div>

            {/* Sidebar / Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 bg-gradient-to-br from-white to-orange-50/50">
                <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target size={16} /> Chỉ tiêu tháng (KPI)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-gray-500">Đã đạt được</span>
                      <span className="text-xl font-black text-gray-900">4,2 tỷ ₫</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '84%' }} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 mt-2 text-right">Mục tiêu: 5,0 tỷ ₫ (84%)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Medal size={16} /> Thành tích
                </h3>
                <div className="flex gap-3 flex-wrap">
                  <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    ⭐ Best Seller Q1
                  </span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    🚀 Deals &gt; 1 tỷ
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-400 font-medium text-center">
                Tham gia hệ thống từ <Calendar size={12} className="inline-block" /> 15/05/2023
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: SECURITY */}
        {activeTab === 'security' && (
          <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-blue-500">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Key size={20} className="text-blue-500" /> Thay đổi mật khẩu
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-2 tracking-widest">Mật khẩu hiện tại</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-2 tracking-widest">Mật khẩu mới</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-2 tracking-widest">Xác nhận mật khẩu mới</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono" />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-black text-sm shadow-md hover:bg-black transition-all active:scale-95">
                  Cập nhật mật khẩu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
