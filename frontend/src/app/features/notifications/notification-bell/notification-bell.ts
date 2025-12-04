import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationItem } from '../notification-item/notification-item';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationItem],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell {
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = signal(false);
  readonly notifications = computed(() => this.notificationService.notifications());
  readonly unreadCount = computed(() => this.notificationService.unreadCount());

  toggleNotifications() {
    this.isOpen.update((open) => !open);
  }

  close() {
    this.isOpen.set(false);
  }

  async markAllAsRead() {
    await this.notificationService.markAllAsRead();
  }

  async handleNotificationClick(notification: { id: number; isRead: boolean; link?: string | null }) {
    if (!notification.isRead) {
      await this.notificationService.markAsRead(notification.id);
    }
    if (notification.link) {
      this.close();
    }
  }

  formatCount(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }
}