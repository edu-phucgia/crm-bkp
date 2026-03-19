import { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, Check, Trash2, Shield, Users, UserCircle, LogOut, Menu } from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useNotifications, AppNotification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigationStore, AppTab } from '../../hooks/useNavigation';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, activeRole, setRole, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, getUnreadCount, removeNotification, addNotification } = useNotifications();
  const { setActiveTab } = useNavigationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const unreadCount = getUnreadCount();

  const handleTestNotification = () => {
    addNotification({
      type: 'system',
      title: 'Thông báo Test',
      message: 'Đây là thông báo test được gửi lúc ' + new Date().toLocaleTimeString('vi-VN'),
      link: 'clients' // tab name
    });
  };

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    if (n.link && n.link !== '#') {
      // Map path to tab if it starts with slash, otherwise use as tab name
      let tabName = n.link;
      if (tabName.startsWith('/')) {
        tabName = tabName.substring(1).split('/')[0];
      }
      setActiveTab(tabName as AppTab);
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'sales_manager': return 'Quản lý';
      case 'sales_rep': return 'Nhân viên';
      default: return '';
    }
  };

  return (
    <header
      className="h-16 border-b flex items-center justify-between px-3 md:px-6 sticky top-0 z-50"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-header)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="block md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 shrink-0"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng, mẫu, báo cáo..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestNotification}
              className="hidden md:flex text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 transition-colors"
            >
              Test Alert
            </button>
            <button 
              className={`relative p-2 rounded-lg transition-all ${showNotifications ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Thông báo"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold text-white shadow-sm animate-in zoom-in"
                  style={{ backgroundColor: 'var(--destructive)' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="fixed inset-x-2 top-[4.25rem] md:absolute md:inset-auto md:right-0 md:top-auto md:mt-2 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2"
              style={{ zIndex: 200 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
                <h3 className="font-semibold text-sm">Thông báo</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.map((n: AppNotification) => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 border-b hover:bg-gray-50 transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{n.title}</span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed pr-6">{n.message}</p>
                      
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            className="p-1 hover:bg-white rounded shadow-sm text-blue-600"
                            title="Đánh dấu đã đọc"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                          className="p-1 hover:bg-white rounded shadow-sm text-gray-400 hover:text-red-500"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {!n.isRead && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-2 border-t text-center bg-gray-50/50">
                <button 
                  disabled={notifications.length === 0}
                  onClick={() => {
                    setActiveTab('me');
                    setShowNotifications(false);
                  }}
                  className={`text-xs font-medium transition-colors ${
                    notifications.length === 0 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  Xem tất cả hoạt động
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={profileRef}>
          <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: 'var(--border)' }}>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user?.name || 'Guest'}</div>
              <div className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>
                {getRoleLabel(activeRole)}
              </div>
            </div>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${showProfileMenu ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {user?.avatar ? (
                  user.avatar.length <= 2 ? user.avatar : <User size={18} strokeWidth={1.5} />
                ) : (
                  <User size={18} strokeWidth={1.5} />
                )}
              </div>
              <ChevronDown size={16} strokeWidth={1.5} className={`transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 py-1.5 z-[100]">
              {/* Role switching section */}
              <div className="px-3 py-1.5">
                <p className="px-2 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vai trò</p>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => { setRole('admin'); setShowProfileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${activeRole === 'admin' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Shield size={16} strokeWidth={activeRole === 'admin' ? 2 : 1.5} />
                    <span>Quản trị viên</span>
                    {activeRole === 'admin' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                  <button 
                    onClick={() => { setRole('sales_manager'); setShowProfileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${activeRole === 'sales_manager' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Users size={16} strokeWidth={activeRole === 'sales_manager' ? 2 : 1.5} />
                    <span>Quản lý nhóm</span>
                  </button>
                  <button 
                    onClick={() => { setRole('sales_rep'); setShowProfileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${activeRole === 'sales_rep' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <User size={16} strokeWidth={activeRole === 'sales_rep' ? 2 : 1.5} />
                    <span>Nhân viên sale</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              {/* Personal section */}
              <div className="px-3 py-1.5">
                <button 
                  onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle size={16} strokeWidth={1.5} />
                  <span>Hồ sơ cá nhân</span>
                </button>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              {/* Logout section */}
              <div className="px-3 py-1.5">
                <button 
                  onClick={() => { logout(); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
