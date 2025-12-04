import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../config/environment';
import { UserPermissions, RoleType } from '../models/admin.model';

// Permission constants matching backend
export const Permissions = {
  // User permissions
  CREATE_POST: 'create_post',
  EDIT_OWN_POST: 'edit_own_post',
  DELETE_OWN_POST: 'delete_own_post',
  CREATE_COMMENT: 'create_comment',
  EDIT_OWN_COMMENT: 'edit_own_comment',
  DELETE_OWN_COMMENT: 'delete_own_comment',
  VOTE: 'vote',
  FAVORITE: 'favorite',

  // Moderator permissions
  DELETE_ANY_POST: 'delete_any_post',
  DELETE_ANY_COMMENT: 'delete_any_comment',
  LOCK_POST: 'lock_post',
  UNLOCK_POST: 'unlock_post',
  BAN_USER_FROM_THREAD: 'ban_user_from_thread',
  VIEW_REPORTS: 'view_reports',

  // Admin permissions
  BAN_USER: 'ban_user',
  UNBAN_USER: 'unban_user',
  PROMOTE_USER: 'promote_user',
  DEMOTE_USER: 'demote_user',
  DELETE_USER: 'delete_user',
  VIEW_ALL_USERS: 'view_all_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  MANAGE_CATEGORIES: 'manage_categories',
} as const;

// Storage key - should match the one in Auth service
const AUTH_STORAGE_KEY = environment.storageKeys?.auth ?? 'meme_forum_auth';

interface StoredAuthData {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    bio: string | null;
    isActive: boolean;
    isBanned: boolean;
    createdAt: string;
    updatedAt: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);

  private readonly permissionsSignal = signal<UserPermissions | null>(null);
  private readonly loadingSignal = signal(false);

  readonly permissions = this.permissionsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly isAdmin = computed(() => {
    const perms = this.permissionsSignal();
    return perms?.isAdmin ?? false;
  });

  readonly isModerator = computed(() => {
    const perms = this.permissionsSignal();
    return perms?.isModerator ?? false;
  });

  readonly userRole = computed(() => {
    const perms = this.permissionsSignal();
    return perms?.role ?? 'user';
  });

  constructor() {
    // Load permissions on init if user is authenticated
    if (this.isUserAuthenticated()) {
      this.loadPermissions();
    }
  }

  /**
   * Check if user is authenticated by checking localStorage
   * This avoids circular dependency with Auth service
   */
  private isUserAuthenticated(): boolean {
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!authData) return false;
      
      const parsed = JSON.parse(authData) as StoredAuthData;
      return !!parsed.token;
    } catch {
      return false;
    }
  }

  /**
   * Get stored user data from localStorage
   * This avoids circular dependency with Auth service
   */
  private getStoredUser(): StoredAuthData['user'] | null {
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!authData) return null;
      
      const parsed = JSON.parse(authData) as StoredAuthData;
      return parsed.user ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Get current user ID from stored data
   */
  getCurrentUserId(): number | null {
    const user = this.getStoredUser();
    return user?.id ?? null;
  }

  /**
   * Load user permissions from the backend
   */
  async loadPermissions(): Promise<void> {
    if (!this.isUserAuthenticated()) {
      this.permissionsSignal.set(null);
      return;
    }

    this.loadingSignal.set(true);
    
    try {
      const response = await this.http
        .get<{
          user_id: number;
          username: string;
          role: RoleType;
          permissions: string[];
          is_admin: boolean;
          is_moderator: boolean;
        }>(`${environment.apiUrl}/admin/me/permissions`)
        .toPromise();

      if (response) {
        this.permissionsSignal.set({
          userId: response.user_id,
          username: response.username,
          role: response.role,
          permissions: response.permissions,
          isAdmin: response.is_admin,
          isModerator: response.is_moderator,
        });
      }
    } catch (error) {
      console.warn('Failed to load permissions from server, using local data', error);
      
      // Fallback: Set permissions based on stored user data
      const user = this.getStoredUser();
      if (user) {
        this.permissionsSignal.set({
          userId: user.id,
          username: user.username,
          role: (user.role as RoleType) || 'user',
          permissions: this.getDefaultPermissionsForRole(user.role),
          isAdmin: user.role === 'admin',
          isModerator: user.role === 'admin' || user.role === 'moderator',
        });
      } else {
        this.permissionsSignal.set(null);
      }
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get default permissions for a role (fallback when API fails)
   */
  private getDefaultPermissionsForRole(role: string): string[] {
    const userPermissions = [
      Permissions.CREATE_POST,
      Permissions.EDIT_OWN_POST,
      Permissions.DELETE_OWN_POST,
      Permissions.CREATE_COMMENT,
      Permissions.EDIT_OWN_COMMENT,
      Permissions.DELETE_OWN_COMMENT,
      Permissions.VOTE,
      Permissions.FAVORITE,
    ];

    const moderatorPermissions = [
      ...userPermissions,
      Permissions.DELETE_ANY_POST,
      Permissions.DELETE_ANY_COMMENT,
      Permissions.LOCK_POST,
      Permissions.UNLOCK_POST,
      Permissions.BAN_USER_FROM_THREAD,
      Permissions.VIEW_REPORTS,
    ];

    const adminPermissions = [
      ...moderatorPermissions,
      Permissions.BAN_USER,
      Permissions.UNBAN_USER,
      Permissions.PROMOTE_USER,
      Permissions.DEMOTE_USER,
      Permissions.DELETE_USER,
      Permissions.VIEW_ALL_USERS,
      Permissions.MANAGE_ROLES,
      Permissions.VIEW_ADMIN_DASHBOARD,
      Permissions.MANAGE_CATEGORIES,
    ];

    switch (role) {
      case 'admin':
        return adminPermissions;
      case 'moderator':
        return moderatorPermissions;
      default:
        return userPermissions;
    }
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const perms = this.permissionsSignal();
    if (!perms) return false;
    return perms.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Check if user can moderate content (is owner or moderator+)
   */
  canModerateContent(contentUserId: number): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;

    // Owner can always manage their own content
    if (currentUserId === contentUserId) return true;

    // Moderators and admins can moderate any content
    return this.isModerator();
  }

  /**
   * Check if user is the owner of a resource
   */
  isOwner(resourceUserId: number): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId !== null && currentUserId === resourceUserId;
  }

  /**
   * Clear all stored permissions (call on logout)
   */
  clearPermissions(): void {
    this.permissionsSignal.set(null);
  }

  /**
   * Refresh permissions from server
   */
  async refreshPermissions(): Promise<void> {
    await this.loadPermissions();
  }
}