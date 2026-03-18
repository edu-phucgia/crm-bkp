import { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoadingScreen } from './components/LoadingScreen';

const CustomerList = lazy(() => import('../pages/customers/CustomerList'));
const CustomerDetail = lazy(() => import('../pages/customers/CustomerDetail'));
const TeamDashboard = lazy(() => import('../pages/dashboard/TeamDashboard'));
const PersonalDashboard = lazy(() => import('./components/PersonalDashboard').then(m => ({ default: m.PersonalDashboard })));
const SLAMonitor = lazy(() => import('../pages/sla/SLAMonitor'));
const Pipeline = lazy(() => import('../pages/pipeline/Pipeline'));
const TaskList = lazy(() => import('../pages/tasks/TaskList'));
const Settings = lazy(() => import('../pages/settings/Settings'));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));

import { useNavigationStore, AppTab } from '../hooks/useNavigation';

export default function App() {
  const [loading, setLoading] = useState(true);
  const { activeTab, setActiveTab } = useNavigationStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AppTab);
    setSelectedCustomerId(null); // clear detail when nav changes
  };

  const renderContent = () => {
    // Customer detail overlay takes priority
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
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingScreen />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
