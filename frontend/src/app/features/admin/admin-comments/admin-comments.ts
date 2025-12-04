import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin';
import { CommentAdminListItem } from '../../../core/models/admin.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinner],
  templateUrl: './admin-comments.html',
  styleUrl: './admin-comments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComments implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly comments = signal<CommentAdminListItem[]>([]);
  readonly isLoading = signal(true);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;

  searchQuery = '';
  statusFilter = '';

  readonly Math = Math;

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.isLoading.set(true);

    this.adminService.getComments({
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchQuery || undefined,
      status: this.statusFilter || undefined,
    }).subscribe({
      next: (response) => {
        this.comments.set(response.comments);
        this.total.set(response.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load comments', err);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadComments();
  }

  deleteComment(comment: CommentAdminListItem) {
    if (!confirm('Delete this comment?')) return;
    
    this.adminService.deleteComment(comment.id).subscribe({
      next: () => this.loadComments(),
      error: (err) => alert('Failed to delete comment'),
    });
  }

  nextPage() {
    if (this.currentPage() * this.pageSize < this.total()) {
      this.currentPage.update(p => p + 1);
      this.loadComments();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadComments();
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}