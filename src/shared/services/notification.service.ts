import api from './api';
import { Notification } from '../types/notification.types';

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get<number>('/notifications/unread-count');
    return response.data;
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
