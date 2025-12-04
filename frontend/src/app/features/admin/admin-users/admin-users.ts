import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin';
import { UserListItem, RoleType } from '../../../core/models/admin.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner, UserAvatar],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly users = signal<UserListItem[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;

  // Filters
  searchQuery = '';
  roleFilter = '';
  statusFilter = '';

  // Modals
  readonly showBanModal = signal(false);
  readonly showRoleModal = signal(false);
  readonly selectedUser = signal<UserListItem | null>(null);
  banReason = '';
  newRole: RoleType = 'user';

  // Alias for template compatibility
  readonly isLoading = this.loading;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.adminService.getUsers({
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchQuery || undefined,
      role: this.roleFilter || undefined,
      status: this.statusFilter || undefined,
    }).subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.loading.set(false);
      },
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters() {
    this.searchQuery = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.currentPage.set(1);
    this.loadUsers();
  }

  nextPage() {
    const totalPages = Math.ceil(this.total() / this.pageSize);
    if (this.currentPage() < totalPages) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.total() / this.pageSize) || 1;
  }

  getRoleClass(role: string): string {
    return `role-${role}`;
  }

  getRoleBadgeClass(role: string): string {
    return `role-${role}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  }

  // Ban functionality
  openBanModal(user: UserListItem) {
    this.selectedUser.set(user);
    this.banReason = '';
    this.showBanModal.set(true);
  }

  closeBanModal() {
    this.showBanModal.set(false);
    this.selectedUser.set(null);
    this.banReason = '';
  }

  confirmBan() {
    const user = this.selectedUser();
    if (!user) return;

    this.adminService.banUser(user.id, this.banReason).subscribe({
      next: () => {
        this.closeBanModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to ban user', err);
        alert('Failed to ban user');
      },
    });
  }

  unbanUser(user: UserListItem) {
    if (!confirm(`Are you sure you want to unban ${user.username}?`)) return;

    this.adminService.unbanUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('Failed to unban user', err);
        alert('Failed to unban user');
      },
    });
  }

  // Role change functionality
  openRoleModal(user: UserListItem) {
    this.selectedUser.set(user);
    this.newRole = user.role;
    this.showRoleModal.set(true);
  }

  closeRoleModal() {
    this.showRoleModal.set(false);
    this.selectedUser.set(null);
  }

  confirmRoleChange() {
    const user = this.selectedUser();
    if (!user) return;

    this.adminService.changeUserRole(user.id, this.newRole).subscribe({
      next: () => {
        this.closeRoleModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to change role', err);
        alert('Failed to change user role');
      },
    });
  }

  deleteUser(user: UserListItem) {
    if (!confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('Failed to delete user', err);
        alert('Failed to delete user');
      },
    });
  }
}