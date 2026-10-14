import api from './api';
import { Notification } from '../types/notification.types';
import { auth } from '../config/firebase';

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    if (!auth?.currentUser) return [];
    try {
      const response = await api.get<Notification[]>('/notifications');
      return response.data || [];
    } catch (err: any) {
      if (err.response?.status === 401) return [];
      throw err;
    }
  }

  async getUnreadCount(): Promise<number> {
    if (!auth?.currentUser) return 0;
    try {
      const response = await api.get<number>('/notifications/unread-count');
      return response.data || 0;
    } catch (err: any) {
      if (err.response?.status === 401) return 0;
      throw err;
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const response = await api.patch<{ modifiedCount: number }>('/notifications/read-all');
    return response.data;
  }
}

export const notificationService = new NotificationService();
