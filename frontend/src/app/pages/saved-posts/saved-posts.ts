import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { PostCard } from '../../features/posts/post-card/post-card';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { PostService } from '../../features/posts/services/post';
import { Post } from '../../core/models/post.model';
import { FavoriteState } from '../../core/services/favorite';

@Component({
  selector: 'app-saved-posts',
  standalone: true,
  imports: [CommonModule, PostCard, LoadingSpinner],
  template: `
    <div class="feed-container">
      <div class="feed-header">
        <h1 class="feed-title">🔖 Saved Posts</h1>
        <button class="refresh-btn" (click)="loadSavedPosts()" [disabled]="isLoading()">
          <span class="material-icons">refresh</span>
        </button>
      </div>

      <div class="posts-list">
        @for (post of posts(); track post.id) {
          <app-post-card [post]="post"></app-post-card>
        } @empty {
          @if (!isLoading()) {
            <div class="empty-state">
              <span class="material-icons">bookmark_border</span>
              <p>No saved posts yet. Save posts to view them here!</p>
            </div>
          }
        }
      </div>

      @if (isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .feed-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .feed-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .feed-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: var(--bg-secondary);
      border-radius: 50%;
      cursor: pointer;
      color: var(--text-primary);
      transition: all 0.2s;
      border: 1px solid var(--border-primary);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--bg-hover);
      transform: rotate(180deg);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);
    }

    .empty-state .material-icons {
      font-size: 64px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPosts implements OnInit {
  private readonly postService = inject(PostService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly favoriteState = inject(FavoriteState);

  readonly posts = signal<Post[]>([]);
  readonly isLoading = signal(false);

  constructor() {
    // ✅ Auto-reload when favorites change
    effect(() => {
      this.favoriteState.changed(); // Track changes
      this.loadSavedPosts();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadSavedPosts();
  }

  loadSavedPosts() {
    this.isLoading.set(true);

    this.postService
      .getFavorites()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          console.log('✅ Loaded saved posts:', list.posts.length);
          this.posts.set(list.posts);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Failed to load saved posts', error);
          this.posts.set([]);
          this.isLoading.set(false);
        },
      });
  }
}