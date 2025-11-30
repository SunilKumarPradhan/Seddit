export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
}