import { Search, Bell, User, ChevronDown } from 'lucide-react';

export function Header() {
  return (
    <header 
      className="h-16 border-b flex items-center justify-between px-6"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-header)',
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
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
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button 
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Thông báo"
        >
          <Bell size={20} strokeWidth={1.5} />
          <span 
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--destructive)' }}
          />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: 'var(--border)' }}>
          <div className="text-right">
            <div className="text-sm font-medium">Nguyễn Văn An</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Quản lý
            </div>
          </div>
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <User size={18} strokeWidth={1.5} />
            </div>
            <ChevronDown size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
