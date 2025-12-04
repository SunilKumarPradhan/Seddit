export interface Comment {
  id: number;
  postId: number;
  userId: number;
  parentId?: number | null;
  content: string;
  upvotes: number;
  downvotes: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string | null;
  authorUsername: string;
  authorAvatar: string | null;
  userVote: 'up' | 'down' | null;
  replies: Comment[];
  isOp?: boolean;
}