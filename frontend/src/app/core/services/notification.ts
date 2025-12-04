import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { environment } from '../config/environment';
import { Auth } from './auth';
import { Notification } from '../models/notification.model';
import { Websocket } from './websocket';

// Raw notification shape returned by the API (may use snake_case)
interface RawNotification {
  id: number;
  user_id?: number;
  userId?: number;
  type?: string;
  message?: string;
  link?: string | null;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
}

interface NotificationListResponse {
  notifications: RawNotification[];
  unread_count: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly websocket = inject(Websocket);

  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly unreadCountSignal = signal(0);
  private readonly loadingSignal = signal(false);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    effect(
      () => {
        if (this.auth.isAuthenticated()) {
          this.bootstrap();
          const handler = (payload: unknown) => this.handleIncoming(payload);
          this.websocket.registerHandler('notification', handler);
          return () => this.websocket.unregisterHandler('notification', handler);
        } else {
          this.notificationsSignal.set([]);
          this.unreadCountSignal.set(0);
        }
        return;
      },
      { allowSignalWrites: true },
    );
  }

  async bootstrap() {
    this.loadingSignal.set(true);
    try {
      const data = await this.http
        .get<NotificationListResponse>(`${environment.apiUrl}/users/me/notifications`)
        .toPromise();
      if (!data) return;
      const mapped = data.notifications.map((notification) => ({
        id: Number(notification.id),
        userId: Number(notification.userId ?? notification.user_id ?? 0),
        type: notification.type ?? 'notification',
        message: notification.message ?? '',
        link: notification.link ?? null,
        isRead: notification.isRead ?? notification.is_read ?? false,
        createdAt: notification.createdAt ?? notification.created_at ?? new Date().toISOString(),
      }));
      this.notificationsSignal.set(mapped);
      this.unreadCountSignal.set(data.unread_count);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async markAsRead(id: number) {
    await this.http
      .post(`${environment.apiUrl}/users/me/notifications/${id}/read`, {})
      .toPromise();
    this.notificationsSignal.update((list) =>
      list.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );
    this.unreadCountSignal.update((count) => Math.max(0, count - 1));
  }

  async markAllAsRead() {
    await this.http
      .post<{ message: string }>(`${environment.apiUrl}/users/me/notifications/read-all`, {})
      .toPromise();
    this.notificationsSignal.update((list) =>
      list.map((notification) => ({ ...notification, isRead: true })),
    );
    this.unreadCountSignal.set(0);
  }

  private handleIncoming(payload: unknown) {
    const data = (payload as { notification?: Partial<RawNotification> })?.notification;
    if (!data || !data.id) return;

    const normalised: Notification = {
      id: Number(data.id),
      userId: Number(data.userId ?? data.user_id ?? 0),
      type: data.type ?? 'notification',
      message: data.message ?? '',
      link: data.link ?? null,
      isRead: false,
      createdAt: String(data.createdAt ?? data.created_at ?? new Date().toISOString()),
    };

    this.notificationsSignal.update((list) => [
      normalised,
      ...list.filter((notification) => notification.id !== normalised.id),
    ]);
    this.unreadCountSignal.update((count) => count + 1);
  }
}