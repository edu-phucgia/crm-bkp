import { create } from 'zustand';

export type AppTab = 'dashboard' | 'team' | 'me' | 'clients' | 'sla' | 'pipeline' | 'profile' | 'tasks' | 'settings';

interface NavigationState {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'me',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
