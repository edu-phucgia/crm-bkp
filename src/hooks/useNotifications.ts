import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { useNavigationStore, AppTab } from './useNavigation';

export type NotificationType = 'zalo' | 'sla' | 'task' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  getUnreadCount: () => number;
}

export const useNotifications = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: '1',
          type: 'sla' as NotificationType,
          title: 'Cảnh báo SLA',
          message: 'Khách hàng Cty Gotech chưa được phản hồi trong 25 phút.',
          timestamp: new Date().toISOString(),
          isRead: false,
          link: 'sla'
        },
        {
          id: '2',
          type: 'zalo' as NotificationType,
          title: 'Nhóm Zalo im lặng',
          message: 'Nhóm "PG - Cty Phúc Hà" đã im lặng hơn 30 ngày.',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          isRead: false,
          link: 'zalo'
        },
        {
          id: '3',
          type: 'task' as NotificationType,
          title: 'Nhiệm vụ quá hạn',
          message: 'Hợp đồng Cty Minh Anh cần được ký trước 10:30 hôm nay.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          isRead: true,
          link: 'tasks'
        }
      ] as AppNotification[],

      addNotification: (notification) => {
        const newNotification: AppNotification = {
          ...notification,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        // Trigger real-time toast
        toast(newNotification.title, {
          description: newNotification.message,
          action: newNotification.link ? {
            label: 'Xem ngay',
            onClick: () => {
              const { setActiveTab } = useNavigationStore.getState();
              let tabName = newNotification.link!;
              if (tabName.startsWith('/')) {
                tabName = tabName.substring(1).split('/')[0];
              }
              setActiveTab(tabName as AppTab);
            }
          } : undefined,
        });

        set((state: NotificationState) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markAsRead: (id: string) => {
        set((state: NotificationState) => ({
          notifications: state.notifications.map((n: AppNotification) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state: NotificationState) => ({
          notifications: state.notifications.map((n: AppNotification) => ({ ...n, isRead: true })),
        }));
      },

      removeNotification: (id: string) => {
        set((state: NotificationState) => ({
          notifications: state.notifications.filter((n: AppNotification) => n.id !== id),
        }));
      },

      getUnreadCount: () => {
        return get().notifications.filter((n: AppNotification) => !n.isRead).length;
      },
    }),
    {
      name: 'pgl-notifications',
    }
  )
);
