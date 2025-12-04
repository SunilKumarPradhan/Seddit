import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin';
import { DashboardStats, RecentActivity } from '../../../core/models/admin.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinner],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly recentActivity = signal<RecentActivity[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService.getDashboard().subscribe({
      next: (response) => {
        this.stats.set(response.stats);
        this.recentActivity.set(response.recentActivity);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard', err);
        this.error.set('Failed to load dashboard data');
        this.isLoading.set(false);
      },
    });
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user_joined':
        return 'person_add';
      case 'post_created':
        return 'article';
      case 'comment_created':
        return 'comment';
      case 'user_banned':
        return 'block';
      default:
        return 'info';
    }
  }
}