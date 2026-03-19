import { create } from 'zustand';

export type AppTab = 'dashboard' | 'team' | 'me' | 'clients' | 'sla' | 'pipeline' | 'profile' | 'tasks' | 'settings' | 'users';

interface NavigationState {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  highlightDealId: string | null;
  setHighlightDealId: (id: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'me',
  setActiveTab: (tab) => set({ activeTab: tab }),
  highlightDealId: null,
  setHighlightDealId: (id) => set({ highlightDealId: id }),
}));
