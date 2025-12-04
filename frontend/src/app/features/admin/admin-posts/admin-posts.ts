import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin';
interface AdminPost {
  id: number;
  title: string;
  author_username: string;
  author_id: number;
  is_locked: boolean;
  is_deleted: boolean;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  reports_count: number;
}

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-posts.html',
  styleUrls: ['./admin-posts.css']
})
export class AdminPosts implements OnInit {
  private adminService = inject(AdminService);

  // Signals
  posts = signal<AdminPost[]>([]);
  total = signal(0);
  currentPage = signal(1);
  pageSize = 20;
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  sortBy = signal('created_at');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Computed
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize) || 1);

  hasMore = computed(() => this.currentPage() * this.pageSize < this.total());

  hasPrevious = computed(() => this.currentPage() > 1);

  // Modal state
  showLockModal = signal(false);
  selectedPost = signal<AdminPost | null>(null);
  lockReason = signal('');

  ngOnInit(): void {
    this.loadPosts();
  }

   loadPosts(): void {
    this.loading.set(true);
    this.error.set(null);

    const params = {
      page: this.currentPage(),
      page_size: this.pageSize,
      search: this.searchQuery() || undefined,
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      sort_by: this.sortBy(),
      sort_order: this.sortOrder()
    };

    this.adminService.getPosts(params).subscribe({
      next: (response: any) => {
        const posts = response.items || response.posts || [];
        this.posts.set(posts);
        this.total.set(response.total || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load posts');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadPosts();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadPosts();
  }

  onSortChange(field: string): void {
    if (this.sortBy() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
    this.loadPosts();
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.currentPage.update(p => p + 1);
      this.loadPosts();
    }
  }

  previousPage(): void {
    if (this.hasPrevious()) {
      this.currentPage.update(p => p - 1);
      this.loadPosts();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPosts();
    }
  }

  openLockModal(post: AdminPost): void {
    this.selectedPost.set(post);
    this.lockReason.set('');
    this.showLockModal.set(true);
  }

  closeLockModal(): void {
    this.showLockModal.set(false);
    this.selectedPost.set(null);
    this.lockReason.set('');
  }

  lockPost(): void {
    const post = this.selectedPost();
    if (!post) return;

    this.adminService.lockPost(post.id, this.lockReason()).subscribe({
      next: () => {
        this.closeLockModal();
        this.loadPosts();
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to lock post');
      }
    });
  }

  unlockPost(post: AdminPost): void {
    if (!confirm(`Unlock post "${post.title}"?`)) return;

    this.adminService.unlockPost(post.id).subscribe({
      next: () => {
        this.loadPosts();
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to unlock post');
      }
    });
  }

  deletePost(post: AdminPost): void {
    if (!confirm(`Delete post "${post.title}"? This action cannot be undone.`)) return;

    this.adminService.deletePost(post.id).subscribe({
      next: () => {
        this.loadPosts();
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to delete post');
      }
    });
  }

  restorePost(post: AdminPost): void {
    if (!confirm(`Restore post "${post.title}"?`)) return;

    this.adminService.restorePost(post.id).subscribe({
      next: () => {
        this.loadPosts();
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to restore post');
      }
    });
  }

  getStatusClass(post: AdminPost): string {
    if (post.is_deleted) return 'status-deleted';
    if (post.is_locked) return 'status-locked';
    return 'status-active';
  }

  getStatusText(post: AdminPost): string {
    if (post.is_deleted) return 'Deleted';
    if (post.is_locked) return 'Locked';
    return 'Active';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}