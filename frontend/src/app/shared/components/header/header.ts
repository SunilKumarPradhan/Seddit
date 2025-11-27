import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationBell } from '../../../features/notifications/notification-bell/notification-bell';
import { UserAvatar } from '../user-avatar/user-avatar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationBell, UserAvatar],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  isAuthenticated = signal(false);
  
  toggleSidebar() {
    console.log('Toggle sidebar');
  }
  
  toggleUserMenu() {
    console.log('Toggle user menu');
  }
}