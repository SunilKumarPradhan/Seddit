export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'admin' | 'moderator' | 'user';
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  postCount: number;
  commentCount: number;
  joinedAt: string;
}