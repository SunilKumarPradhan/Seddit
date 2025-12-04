import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { CATEGORIES } from '../../../core/constants/categories';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly auth = inject(Auth);  // Changed from private to public

  readonly categories = signal(CATEGORIES);
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly isCollapsed = signal(false);

  readonly user = computed(() => this.auth.user());

  isAdmin(): boolean {
    const user = this.auth.user();
    return user?.role === 'admin';
  }

  isModerator(): boolean {
    const user = this.auth.user();
    return user?.role === 'admin' || user?.role === 'moderator';
  }
}