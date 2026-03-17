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
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
        { id: 'zalo',      icon: MessageSquare,  label: 'Zalo Manager' },
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
      {/* Logo and Toggle */}
      <div className="h-16 flex items-center px-4 border-b shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
                <span className="text-white font-black text-sm">P</span>
              </div>
              <div className="overflow-hidden">
                <span className="font-black text-white text-sm truncate block">PGL CRM</span>
                <p className="text-[9px] text-white/40 font-medium -mt-0.5">v2.0 2026</p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/70 hover:text-white shrink-0 ml-1"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
          </>
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


    </div>
  );
}