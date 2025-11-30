export interface Notification {
}
export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}