import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostCard } from '../../features/posts/post-card/post-card';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { PostService } from '../../features/posts/services/post';
import { Post } from '../../core/models/post.model';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [PostCard, LoadingSpinner],
  template: `
    <div class="feed-container">
      <div class="feed-header">
        <h1 class="feed-title">{{ getCategoryTitle() }}</h1>
      </div>
      
      <div class="posts-list">
        @for (post of posts(); track post.id) {
          <app-post-card [post]="post"></app-post-card>
        } @empty {
          @if (!isLoading()) {
            <div class="empty-state">
              <span class="material-icons">inbox</span>
              <p>No posts in this category yet. Be the first to post!</p>
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
    }

    .feed-header {
      margin-bottom: 24px;
    }

    .feed-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: capitalize;
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
export class Category implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly postService = inject(PostService);
  private readonly destroyRef = inject(DestroyRef);

  readonly posts = signal<Post[]>([]);
  readonly isLoading = signal(false);
  readonly category = signal<string>('');

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const categorySlug = params.get('slug');
      if (categorySlug) {
        this.category.set(categorySlug);
        this.loadPosts(categorySlug);
      }
    });
  }

  loadPosts(tag: string) {
    this.isLoading.set(true);

    this.postService
      .list({ tag, sortBy: 'new' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.posts.set(list.posts);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load posts', error);
          this.posts.set([]);
          this.isLoading.set(false);
        },
      });
  }

  getCategoryTitle(): string {
    const cat = this.category();
    return cat ? `#${cat}` : 'Category';
  }
}