import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  Building2,
  UsersRound,
  UserCircle2,
  AlertTriangle,
  GitBranch,
  CheckSquare,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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

export function Sidebar({ activeTab, onTabChange, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  const menuGroups: MenuGroup[] = [
    {
      title: 'Dashboard',
      items: [
        { id: 'me',        icon: UserCircle2,     label: 'Dashboard của tôi' },
        { id: 'dashboard', icon: LayoutDashboard,  label: 'Tổng quan' },
        { id: 'team',      icon: UsersRound,       label: 'Dashboard Nhóm' },
      ],
    },
    {
      title: 'Bán hàng',
      items: [
        { id: 'clients',  icon: Building2,  label: 'Khách hàng' },
        { id: 'pipeline', icon: GitBranch,  label: 'Pipeline' },
      ],
    },
    {
      title: 'Vận hành',
      items: [
        { id: 'tasks', icon: CheckSquare,   label: 'Nhiệm vụ' },
        { id: 'sla',   icon: AlertTriangle, label: 'SLA Monitor' },
      ],
    },
  ];

  const bottomItems: MenuItem[] = [
    { id: 'users',    icon: UserCog,  label: 'Người dùng' },
    { id: 'settings', icon: Settings, label: 'Cài đặt' },
  ];

  const { user, activeRole } = useAuth();
  if (!user) return null;

  const filteredMenuGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.id === 'team' && activeRole === 'sales_rep') return false;
        if (item.id === 'sla'  && activeRole === 'sales_rep') return false;
        return true;
      }),
    }))
    .filter(group => group.items.length > 0);

  const filteredBottomItems = bottomItems.filter(item => {
    if ((item.id === 'settings' || item.id === 'users') && activeRole !== 'admin') return false;
    return true;
  });

  const textStyle: React.CSSProperties = {
    transform: isCollapsed ? 'translateX(-200px)' : 'translateX(0)',
    transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    pointerEvents: isCollapsed ? 'none' : 'auto',
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden shrink-0 fixed inset-y-0 left-0 z-50 md:relative md:z-auto"
      style={{
        width: isCollapsed ? '60px' : '240px',
        transform: (isDesktop || mobileOpen) ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
        backgroundColor: 'var(--sidebar)',
        color: 'var(--sidebar-foreground)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo + Toggle */}
      <div
        className="h-16 flex items-center shrink-0 border-b"
        style={{ borderColor: 'var(--sidebar-border)', padding: '0 14px' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--primary)' }}
          onClick={() => setIsCollapsed(v => !v)}
        >
          <span className="text-white font-black text-sm">P</span>
        </div>

        <div className="ml-2 flex-1 overflow-hidden">
        <div className="flex items-center justify-between" style={textStyle}>
          <div>
            <span className="font-black text-white text-sm block">PGL CRM</span>
            <p className="text-[9px] text-white/40 font-medium -mt-0.5">v2.0 2026</p>
          </div>
          <button
            onClick={() => setIsCollapsed(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/70 hover:text-white ml-8"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1 overflow-y-auto scrollbar-hide">
        {filteredMenuGroups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? 'mt-3' : 'mt-2'}>

            {/* Group divider / label */}
            <div className="relative h-7 flex items-center">
              {/* Divider shown only when collapsed */}
              <div
                className="mx-3 h-px bg-white/10 w-full"
                style={{
                  opacity: isCollapsed ? 1 : 0,
                  transition: 'opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                }}
              />
              <div className="px-5 overflow-hidden">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30" style={textStyle}>
                  {group.title}
                </p>
              </div>
            </div>

            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => { onTabChange(item.id); onMobileClose?.(); }}
                      title={isCollapsed ? item.label : undefined}
                      className="w-full flex items-center rounded-lg transition-colors overflow-hidden"
                      style={{
                        padding: '10px 12px',
                        backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                        color: isActive ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                      }}
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

                      <div className="ml-3 flex-1 items-start overflow-hidden">
                        <span className="flex items-center gap-2 text-[13px]" style={textStyle}>
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
                      </div>
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
          <div className="h-7 flex items-center">
            <div className="px-3 overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30" style={textStyle}>
                Hệ thống
              </p>
            </div>
          </div>
          <ul className="space-y-0.5">
            {filteredBottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { onTabChange(item.id); onMobileClose?.(); }}
                    title={isCollapsed ? item.label : undefined}
                    className="w-full flex items-center rounded-lg transition-colors overflow-hidden"
                    style={{
                      padding: '10px 12px',
                      backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                      color: isActive ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    <div className="ml-3 overflow-hidden">
                      <span className={`text-[13px] ${isActive ? 'font-black' : 'font-medium'}`} style={textStyle}>
                        {item.label}
                      </span>
                    </div>
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
