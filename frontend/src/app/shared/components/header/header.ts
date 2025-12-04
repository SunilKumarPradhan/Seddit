import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationBell } from '../../../features/notifications/notification-bell/notification-bell';
import { UserAvatar } from '../user-avatar/user-avatar';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationBell, UserAvatar],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly auth = inject(Auth);
  
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly user = this.auth.user;

  toggleSidebar() {
    console.log('Toggle sidebar');
  }

  // ✅ REMOVED: toggleUserMenu() method

  logout() {
    this.auth.logout();
  }
}