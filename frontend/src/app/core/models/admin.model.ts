export type RoleType = 'admin' | 'moderator' | 'user';

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: RoleType;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  postCount: number;
  commentCount: number;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: RoleType;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  postCount: number;
  commentCount: number;
}

export interface PostAdminListItem {
  id: number;
  title: string;
  authorUsername: string;
  authorId: number;
  isLocked: boolean;
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  reportsCount: number;
}

export interface PostAdminListResponse {
  posts: PostAdminListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CommentAdminListItem {
  id: number;
  content: string;
  authorUsername: string;
  authorId: number;
  postId: number;
  postTitle: string;
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  reportsCount: number;
}

export interface CommentAdminListResponse {
  comments: CommentAdminListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalComments: number;
  postsToday: number;
  commentsToday: number;
  newUsersToday: number;
}

export interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
  userId?: number;
  postId?: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

export interface RoleInfo {
  id: number;
  name: RoleType;
  permissions: string[];
  userCount: number;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

export interface UserPermissions {
  userId: number;
  username: string;
  role: RoleType;
  permissions: string[];
  isAdmin: boolean;
  isModerator: boolean;
}