import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationItem } from '../notification-item/notification-item';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationItem],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css'
})
export class NotificationBell {
  isOpen = signal(false);
  notifications = signal<any[]>([]);
  unreadCount = signal(0);
  hasUnread = signal(false);
  
  toggleNotifications() {
    this.isOpen.update(v => !v);
  }
  
  close() {
    this.isOpen.set(false);
  }
  
  markAllAsRead() {
    this.unreadCount.set(0);
    this.hasUnread.set(false);
  }
  
  handleNotificationClick(notification: any) {
    console.log('Notification clicked:', notification);
  }
  
  formatCount(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }
}