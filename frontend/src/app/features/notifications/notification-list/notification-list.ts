import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification';
import { NotificationItem } from '../notification-item/notification-item';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, NotificationItem],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationList {
  private readonly notificationService = inject(NotificationService);
  readonly notifications = computed(() => this.notificationService.notifications());
  readonly unreadCount = computed(() => this.notificationService.unreadCount());
}