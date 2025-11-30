import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../core/config/environment';
import { map } from 'rxjs';
import { Post, PostList } from '../../../core/models/post.model';

interface PostDto {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  tag: string | null;
  image_url: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  updated_at: string | null;
  author_username: string;
  author_avatar: string | null;
  user_vote: 'up' | 'down' | null;
  is_favorited: boolean;
}

interface PostListDto {
  posts: PostDto[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

interface CreatePostDto {
  title: string;
  description?: string | null;
  tag?: string | null;
  imageUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);

  list(options: { page?: number; sortBy?: 'new' | 'hot' | 'top'; tag?: string | null } = {}) {
    const params = new HttpParams({
      fromObject: {
        page: (options.page ?? 1).toString(),
        page_size: '20',
        sort_by: options.sortBy ?? 'new',
        ...(options.tag ? { tag: options.tag } : {}),
      },
    });

    return this.http
      .get<PostListDto>(`${environment.apiUrl}/posts`, { params })
      .pipe(map((dto) => this.mapList(dto)));
  }

  getOne(id: number | string) {
    return this.http
      .get<PostDto>(`${environment.apiUrl}/posts/${id}`)
      .pipe(map((dto) => this.mapPost(dto)));
  }

  create(payload: CreatePostDto) {
    const body = {
      title: payload.title,
      description: payload.description ?? null,
      tag: payload.tag ?? null,
      image_url: payload.imageUrl ?? null,
    };

    return this.http
      .post<PostDto>(`${environment.apiUrl}/posts`, body)
      .pipe(map((dto) => this.mapPost(dto)));
  }

  delete(postId: number) {
    return this.http.delete(`${environment.apiUrl}/posts/${postId}`);
  }

  vote(postId: number, voteType: 'up' | 'down') {
    return this.http.post(`${environment.apiUrl}/posts/${postId}/vote`, {
      vote_type: voteType,
    });
  }

  removeVote(postId: number) {
    return this.http.delete(`${environment.apiUrl}/posts/${postId}/vote`);
  }

  // ✅ VERIFIED: Correct endpoints for favorite/unfavorite
  favorite(postId: number) {
    return this.http.post(`${environment.apiUrl}/posts/${postId}/favorite`, {});
  }

  unfavorite(postId: number) {
    return this.http.delete(`${environment.apiUrl}/posts/${postId}/favorite`);
  }

  getFavorites(options: { page?: number } = {}) {
    const params = new HttpParams({
      fromObject: {
        page: (options.page ?? 1).toString(),
        page_size: '20',
      },
    });

    return this.http
      .get<PostListDto>(`${environment.apiUrl}/posts/favorites`, { params })
      .pipe(map((dto) => this.mapList(dto)));
  }

  private mapList(dto: PostListDto): PostList {
    return {
      posts: dto.posts.map((post) => this.mapPost(post)),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
      hasMore: dto.has_more,
    };
  }

  private mapPost(dto: PostDto): Post {
    return {
      id: dto.id,
      userId: dto.user_id,
      title: dto.title,
      description: dto.description,
      tag: dto.tag,
      imageUrl: dto.image_url,
      upvotes: dto.upvotes,
      downvotes: dto.downvotes,
      commentCount: dto.comment_count,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      authorUsername: dto.author_username,
      authorAvatar: dto.author_avatar,
      userVote: dto.user_vote,
      isFavorited: dto.is_favorited,
    };
  }
}