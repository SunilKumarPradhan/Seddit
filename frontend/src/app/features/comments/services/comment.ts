import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../core/config/environment';
import { map } from 'rxjs';
import { Comment } from '../../../core/models/comment.model';
import { Observable } from 'rxjs';

interface CommentDto {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  upvotes: number;
  downvotes: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  author_username: string;
  author_avatar: string | null;
  user_vote: 'up' | 'down' | null;
  replies: CommentDto[];
}

interface CommentTreeDto {
  comments: CommentDto[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);

  // ✅ FIXED: Implement real API call for voting
  vote(commentId: number, voteType: 'up' | 'down'): Observable<any> {
    return this.http.post(`${environment.apiUrl}/comments/${commentId}/vote`, {
      vote_type: voteType,
    });
  }

  // ✅ ADD THIS: Remove vote
  removeVote(commentId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/comments/${commentId}/vote`);
  }

  delete(commentId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/comments/${commentId}`);
  }

  getTree(postId: number | string) {
    return this.http
      .get<CommentTreeDto>(`${environment.apiUrl}/comments/post/${postId}`)
      .pipe(map((dto) => dto.comments.map((comment) => this.mapComment(comment))));
  }

  create(postId: number | string, content: string, parentId?: number) {
    return this.http
      .post<CommentDto>(`${environment.apiUrl}/comments`, {
        post_id: Number(postId),
        content,
        parent_id: parentId ?? null,
      })
      .pipe(map((dto) => this.mapComment(dto)));
  }

  private mapComment(dto: CommentDto): Comment {
    return {
      id: dto.id,
      postId: dto.post_id,
      userId: dto.user_id,
      parentId: dto.parent_id,
      content: dto.content,
      upvotes: dto.upvotes,
      downvotes: dto.downvotes,
      isDeleted: dto.is_deleted,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      authorUsername: dto.author_username,
      authorAvatar: dto.author_avatar,
      userVote: dto.user_vote,
      replies: dto.replies?.map((reply) => this.mapComment(reply)) ?? [],
    };
  }
}