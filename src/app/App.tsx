import { useState, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoadingScreen } from './components/LoadingScreen';
import { useAuth } from './contexts/AuthContext';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const CustomerList = lazy(() => import('../pages/customers/CustomerList'));
const CustomerDetail = lazy(() => import('../pages/customers/CustomerDetail'));
const TeamDashboard = lazy(() => import('../pages/dashboard/TeamDashboard'));
const PersonalDashboard = lazy(() => import('./components/PersonalDashboard').then(m => ({ default: m.PersonalDashboard })));
const SLAMonitor = lazy(() => import('../pages/sla/SLAMonitor'));
const Pipeline = lazy(() => import('../pages/pipeline/Pipeline'));
const TaskList = lazy(() => import('../pages/tasks/TaskList'));
const Settings = lazy(() => import('../pages/settings/Settings'));
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));

import { useNavigationStore, AppTab } from '../hooks/useNavigation';

// Skeleton cùng màu nền — không flash khi lazy load lần đầu
function PageSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-pulse" style={{ backgroundColor: 'var(--background)' }}>
      <div className="h-8 w-48 rounded-xl bg-white/5" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/5" />)}
      </div>
      <div className="h-64 rounded-2xl bg-white/5" />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { activeTab, setActiveTab } = useNavigationStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Chờ Supabase kiểm tra session (tránh flash màn hình login)
  if (loading) {
    return <LoadingScreen />;
  }

  // Chưa đăng nhập → hiện trang Login
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AppTab);
    setSelectedCustomerId(null);
  };

  const renderContent = () => {
    if (selectedCustomerId && activeTab === 'clients') {
      return (
        <CustomerDetail
          id={selectedCustomerId}
          onBack={() => setSelectedCustomerId(null)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'team':
        return <TeamDashboard />;
      case 'me':
        return <PersonalDashboard />;
      case 'clients':
        return (
          <CustomerList
            onCustomerSelect={(id) => setSelectedCustomerId(id)}
          />
        );
      case 'sla':
        return <SLAMonitor />;
      case 'pipeline':
        return <Pipeline />;
      case 'profile':
        return <ProfileView />;
      case 'tasks':
        return <TaskList />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <UsersPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageSkeleton />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
