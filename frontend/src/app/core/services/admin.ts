import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../config/environment';
import {
  UserListResponse,
  UserListItem,
  UserDetail,
  PostAdminListResponse,
  PostAdminListItem,
  CommentAdminListResponse,
  CommentAdminListItem,
  DashboardResponse,
  DashboardStats,
  RecentActivity,
  RoleInfo,
  ActionResponse,
  RoleType,
} from '../models/admin.model';

interface UserListDto {
  users: {
    id: number;
    username: string;
    email: string;
    avatar_url: string | null;
    role: string;
    is_active: boolean;
    is_banned: boolean;
    created_at: string;
    post_count: number;
    comment_count: number;
  }[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

interface UserDetailDto {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string | null;
  post_count: number;
  comment_count: number;
}

interface PostListDto {
  posts: {
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
  }[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

interface CommentListDto {
  comments: {
    id: number;
    content: string;
    author_username: string;
    author_id: number;
    post_id: number;
    post_title: string;
    is_deleted: boolean;
    upvotes: number;
    downvotes: number;
    created_at: string;
    reports_count: number;
  }[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

interface DashboardDto {
  stats: {
    total_users: number;
    active_users: number;
    banned_users: number;
    total_posts: number;
    total_comments: number;
    posts_today: number;
    comments_today: number;
    new_users_today: number;
  };
  recent_activity: {
    type: string;
    message: string;
    timestamp: string;
    user_id?: number;
    post_id?: number;
  }[];
}

interface RoleListDto {
  roles: {
    id: number;
    name: string;
    permissions: string[];
    user_count: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  // ==================== DASHBOARD ====================

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardDto>(`${this.apiUrl}/dashboard`).pipe(
      map((dto) => ({
        stats: {
          totalUsers: dto.stats.total_users,
          activeUsers: dto.stats.active_users,
          bannedUsers: dto.stats.banned_users,
          totalPosts: dto.stats.total_posts,
          totalComments: dto.stats.total_comments,
          postsToday: dto.stats.posts_today,
          commentsToday: dto.stats.comments_today,
          newUsersToday: dto.stats.new_users_today,
        },
        recentActivity: dto.recent_activity.map((a) => ({
          type: a.type,
          message: a.message,
          timestamp: a.timestamp,
          userId: a.user_id,
          postId: a.post_id,
        })),
      }))
    );
  }

  // ==================== USER MANAGEMENT ====================

  getUsers(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Observable<UserListResponse> {
    let params = new HttpParams();
    
    if (options.page) params = params.set('page', options.page.toString());
    if (options.pageSize) params = params.set('page_size', options.pageSize.toString());
    if (options.search) params = params.set('search', options.search);
    if (options.role) params = params.set('role', options.role);
    if (options.status) params = params.set('status', options.status);
    if (options.sortBy) params = params.set('sort_by', options.sortBy);
    if (options.sortOrder) params = params.set('sort_order', options.sortOrder);

    return this.http.get<UserListDto>(`${this.apiUrl}/users`, { params }).pipe(
      map((dto) => ({
        users: dto.users.map((u) => this.mapUserListItem(u)),
        total: dto.total,
        page: dto.page,
        pageSize: dto.page_size,
        hasMore: dto.has_more,
      }))
    );
  }

  getUserDetail(userId: number): Observable<UserDetail> {
    return this.http.get<UserDetailDto>(`${this.apiUrl}/users/${userId}`).pipe(
      map((dto) => this.mapUserDetail(dto))
    );
  }

  banUser(userId: number, reason?: string): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/users/${userId}/ban`, {
      reason,
    });
  }

  unbanUser(userId: number): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/users/${userId}/unban`, {});
  }

  changeUserRole(userId: number, role: RoleType): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/users/${userId}/role`, {
      role,
    });
  }

  deleteUser(userId: number): Observable<ActionResponse> {
    return this.http.delete<ActionResponse>(`${this.apiUrl}/users/${userId}`);
  }

  // ==================== POST MANAGEMENT ====================

  getPosts(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Observable<PostAdminListResponse> {
    let params = new HttpParams();
    
    if (options.page) params = params.set('page', options.page.toString());
    if (options.pageSize) params = params.set('page_size', options.pageSize.toString());
    if (options.search) params = params.set('search', options.search);
    if (options.status) params = params.set('status', options.status);
    if (options.sortBy) params = params.set('sort_by', options.sortBy);
    if (options.sortOrder) params = params.set('sort_order', options.sortOrder);

    return this.http.get<PostListDto>(`${this.apiUrl}/posts`, { params }).pipe(
      map((dto) => ({
        posts: dto.posts.map((p) => this.mapPostListItem(p)),
        total: dto.total,
        page: dto.page,
        pageSize: dto.page_size,
        hasMore: dto.has_more,
      }))
    );
  }

  lockPost(postId: number, reason?: string): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/posts/${postId}/lock`, {
      reason,
    });
  }

  unlockPost(postId: number): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/posts/${postId}/unlock`, {});
  }

  deletePost(postId: number): Observable<ActionResponse> {
    return this.http.delete<ActionResponse>(`${this.apiUrl}/posts/${postId}`);
  }

  restorePost(postId: number): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/posts/${postId}/restore`, {});
  }

  // ==================== COMMENT MANAGEMENT ====================

  getComments(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    postId?: number;
    status?: string;
  } = {}): Observable<CommentAdminListResponse> {
    let params = new HttpParams();
    
    if (options.page) params = params.set('page', options.page.toString());
    if (options.pageSize) params = params.set('page_size', options.pageSize.toString());
    if (options.search) params = params.set('search', options.search);
    if (options.postId) params = params.set('post_id', options.postId.toString());
    if (options.status) params = params.set('status', options.status);

    return this.http.get<CommentListDto>(`${this.apiUrl}/comments`, { params }).pipe(
      map((dto) => ({
        comments: dto.comments.map((c) => this.mapCommentListItem(c)),
        total: dto.total,
        page: dto.page,
        pageSize: dto.page_size,
        hasMore: dto.has_more,
      }))
    );
  }

  deleteComment(commentId: number): Observable<ActionResponse> {
    return this.http.delete<ActionResponse>(`${this.apiUrl}/comments/${commentId}`);
  }

  // ==================== ROLE MANAGEMENT ====================

  getRoles(): Observable<RoleInfo[]> {
    return this.http.get<RoleListDto>(`${this.apiUrl}/roles`).pipe(
      map((dto) =>
        dto.roles.map((r) => ({
          id: r.id,
          name: r.name as RoleType,
          permissions: r.permissions,
          userCount: r.user_count,
        }))
      )
    );
  }

  // ==================== MAPPERS ====================

  private mapUserListItem(dto: UserListDto['users'][0]): UserListItem {
    return {
      id: dto.id,
      username: dto.username,
      email: dto.email,
      avatarUrl: dto.avatar_url,
      role: dto.role as RoleType,
      isActive: dto.is_active,
      isBanned: dto.is_banned,
      createdAt: dto.created_at,
      postCount: dto.post_count,
      commentCount: dto.comment_count,
    };
  }

  private mapUserDetail(dto: UserDetailDto): UserDetail {
    return {
      id: dto.id,
      username: dto.username,
      email: dto.email,
      avatarUrl: dto.avatar_url,
      bio: dto.bio,
      role: dto.role as RoleType,
      isActive: dto.is_active,
      isBanned: dto.is_banned,
      banReason: dto.ban_reason,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      postCount: dto.post_count,
      commentCount: dto.comment_count,
    };
  }

  private mapPostListItem(dto: PostListDto['posts'][0]): PostAdminListItem {
    return {
      id: dto.id,
      title: dto.title,
      authorUsername: dto.author_username,
      authorId: dto.author_id,
      isLocked: dto.is_locked,
      isDeleted: dto.is_deleted,
      upvotes: dto.upvotes,
      downvotes: dto.downvotes,
      commentCount: dto.comment_count,
      createdAt: dto.created_at,
      reportsCount: dto.reports_count,
    };
  }

  private mapCommentListItem(dto: CommentListDto['comments'][0]): CommentAdminListItem {
    return {
      id: dto.id,
      content: dto.content,
      authorUsername: dto.author_username,
      authorId: dto.author_id,
      postId: dto.post_id,
      postTitle: dto.post_title,
      isDeleted: dto.is_deleted,
      upvotes: dto.upvotes,
      downvotes: dto.downvotes,
      createdAt: dto.created_at,
      reportsCount: dto.reports_count,
    };
  }
}