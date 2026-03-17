import { useState } from 'react';
import CustomerList from '../pages/customers/CustomerList';
import CustomerDetail from '../pages/customers/CustomerDetail';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import TeamDashboard from '../pages/dashboard/TeamDashboard';
import { PersonalDashboard } from './components/PersonalDashboard';
import SLAMonitor from '../pages/sla/SLAMonitor';
import Pipeline from '../pages/pipeline/Pipeline';
import TaskList from '../pages/tasks/TaskList';
import Settings from '../pages/settings/Settings';
import { ProfileView } from './components/ProfileView';

export default function App() {
  const [activeTab, setActiveTab] = useState('me');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
