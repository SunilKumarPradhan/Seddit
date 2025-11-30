export interface Post {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  tag: string | null;
  imageUrl: string | null;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  updatedAt?: string | null;
  authorUsername: string;
  authorAvatar: string | null;
  userVote: 'up' | 'down' | null;
  isFavorited: boolean;
}

export interface PostList {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}