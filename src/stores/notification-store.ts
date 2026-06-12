import { create } from 'zustand';

import { getNotifications, markAllNotificationsRead } from '@/lib/api';
import type { ApiNotification } from '@/types/api';

type NotificationStore = {
  error: null | string;
  initialized: boolean;
  items: ApiNotification[];
  loading: boolean;
  unreadCount: number;
  clear: () => void;
  markReadOnOpen: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  error: null,
  initialized: false,
  items: [],
  loading: false,
  unreadCount: 0,
  clear: () =>
    set({
      error: null,
      initialized: false,
      items: [],
      loading: false,
      unreadCount: 0,
    }),
  markReadOnOpen: async () => {
    if (get().unreadCount === 0) {
      return;
    }

    await markAllNotificationsRead();

    const readAt = new Date().toISOString();
    set((state) => ({
      items: state.items.map((item) => ({
        ...item,
        readAt: item.readAt ?? readAt,
      })),
      unreadCount: 0,
    }));
  },
  refresh: async () => {
    set({ loading: true, error: null });

    try {
      const feed = await getNotifications();
      set({
        error: null,
        initialized: true,
        items: feed.items,
        unreadCount: feed.unreadCount,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Could not load notifications.',
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  },
}));
