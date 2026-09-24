export enum NotificationType {
  INVESTIGATOR_ASSIGNED = 'INVESTIGATOR_ASSIGNED',
  CASE_STATUS_CHANGED = 'CASE_STATUS_CHANGED',
  COMPLAINT_STATUS_CHANGED = 'COMPLAINT_STATUS_CHANGED',
}

export interface Notification {
  _id: string;
  userId: string;
  caseId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
