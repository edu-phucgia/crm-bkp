import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  UsersRound,
  UserCircle2,
  AlertTriangle,
  GitBranch,
  CheckSquare,
  ChevronDown,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: string | null;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Chỉ hiển thị các menu có API Supabase hoạt động + dữ liệu thật
  // Các menu bị ẩn tạm: Zalo Manager, Báo giá, Câu mẫu, Hợp đồng,
  // Đơn hàng, HSNL, Mẫu thử nghiệm, Báo cáo, Lịch hẹn, Phân tích
  const menuGroups: MenuGroup[] = [
    {
      title: 'Dashboard',
      items: [
        { id: 'me',        icon: UserCircle2,    label: 'Dashboard của tôi' },
        { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
        { id: 'team',      icon: UsersRound,      label: 'Dashboard Nhóm' },
      ],
    },
    {
      title: 'Bán hàng',
      items: [
        { id: 'clients',   icon: Building2,      label: 'Khách hàng' },
        { id: 'pipeline',  icon: GitBranch,      label: 'Pipeline' },
      ],
    },
    {
      title: 'Vận hành',
      items: [
        { id: 'tasks',     icon: CheckSquare,    label: 'Nhiệm vụ' },
        { id: 'sla',       icon: AlertTriangle,  label: 'SLA Monitor' },
      ],
    },
  ];

  const bottomItems: MenuItem[] = [
    { id: 'settings', icon: Settings, label: 'Cài đặt' },
  ];

  const { user, activeRole } = useAuth();

  if (!user) return null;

  const filteredMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.id === 'team' && activeRole === 'sales_rep') return false;
      if (item.id === 'sla' && activeRole === 'sales_rep') return false;
      return true;
    })
  })).filter(group => group.items.length > 0);

  const filteredBottomItems = bottomItems.filter(item => {
    if (item.id === 'settings' && activeRole !== 'admin') return false;
    return true;
  });

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'sales_manager': return 'Quản lý';
      case 'sales_rep': return 'Nhân viên';
      default: return '';
    }
  };

  return (
    <div
      className="h-screen flex flex-col transition-all duration-300 ease-in-out"
      style={{
        width: isCollapsed ? '60px' : '240px',
        backgroundColor: 'var(--sidebar)',
        color: 'var(--sidebar-foreground)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
              <span className="text-white font-black text-sm">P</span>
            </div>
            <div>
              <span className="font-black text-white text-sm">PGL CRM</span>
              <p className="text-[9px] text-white/40 font-medium -mt-0.5">v2.0 2026</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--primary)' }}>
            <span className="text-white font-black text-sm">P</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1 overflow-y-auto">
        {filteredMenuGroups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? 'mt-3' : 'mt-2'}>
            {/* Group label */}
            {!isCollapsed && (
              <p className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
                {group.title}
              </p>
            )}
            {isCollapsed && gi > 0 && (
              <div className="mx-3 my-2 h-px bg-white/10" />
            )}

            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onTabChange(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                        color: isActive ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="relative shrink-0">
                        <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                        {item.badge && isCollapsed && (
                          <span
                            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                            style={{ width: '14px', height: '14px', backgroundColor: '#dc2626', color: '#fff', fontSize: '8px', fontWeight: 900 }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="flex-1 flex items-center justify-between text-[13px]">
                          <span className={isActive ? 'font-black' : 'font-medium'}>{item.label}</span>
                          {item.badge && (
                            <span
                              className="flex items-center justify-center rounded-full px-1.5"
                              style={{ minWidth: '20px', height: '18px', backgroundColor: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings */}
      {filteredBottomItems.length > 0 && (
        <div className="border-t px-2 py-3 shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
          {!isCollapsed && (
            <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
              Hệ thống
            </p>
          )}
          <ul className="space-y-0.5">
            {filteredBottomItems.map((item) => {
              const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                    color: isActive ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {!isCollapsed && (
                    <span className={`text-[13px] ${isActive ? 'font-black' : 'font-medium'}`}>{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      )}

      {/* User Profile Footer */}
      <button 
        onClick={() => onTabChange('profile')}
        className="w-full text-left p-3 border-t shrink-0 relative hover:bg-white/5 transition-colors cursor-pointer outline-none" 
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-[14px] font-bold text-white truncate leading-tight">{user.name}</p>
                    <p className={`text-[12px] font-medium mt-0.5 ${
                        activeRole === 'admin' ? 'text-indigo-300' : 
                        activeRole === 'sales_manager' ? 'text-blue-300' : 
                        'text-gray-400'
                    }`}>
                        {getRoleLabel(activeRole)}
                    </p>
                </div>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${
                activeRole === 'admin' ? 'bg-indigo-500 text-white' : 
                activeRole === 'sales_manager' ? 'bg-blue-600 text-white' : 
                'bg-gray-700 text-gray-200'
              }`}>
                  {user.avatar === 'LM' ? 'LM' : <User size={18} />}
              </div>
              {!isCollapsed && (
                <ChevronDown size={14} className="text-white/50" />
              )}
            </div>
        </div>
      </button>

      {/* Collapse toggle */}

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="h-10 flex items-center justify-center border-t hover:bg-white/5 transition-colors shrink-0"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        {isCollapsed
          ? <ChevronRight size={16} strokeWidth={2} />
          : <ChevronLeft size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}