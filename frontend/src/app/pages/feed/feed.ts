import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostCard } from '../../features/posts/post-card/post-card';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { PostService } from '../../features/posts/services/post';
import { Post } from '../../core/models/post.model';

type FeedFilter = 'home' | 'hot' | 'new' | 'top';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCard, LoadingSpinner],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feed implements OnInit {
  private readonly postService = inject(PostService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly posts = signal<Post[]>([]);
  readonly currentFilter = signal<FeedFilter>('home');
  readonly isLoading = signal(false);

  private readonly validFilters: FeedFilter[] = ['home', 'hot', 'new', 'top'];

  readonly feedTitle = computed(() => this.getFeedTitle(this.currentFilter()));

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const param = params.get('filter') as FeedFilter | null;
        const filter = param && this.validFilters.includes(param) ? param : 'home';
        this.currentFilter.set(filter);
        this.loadPosts();
      });

    if (!this.route.snapshot.paramMap.get('filter')) {
      this.loadPosts();
    }
  }

  loadPosts() {
    const filter = this.currentFilter();
    this.isLoading.set(true);

    this.postService
      .list({ sortBy: this.getSortParam(filter) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          let posts = [...list.posts];

          switch (filter) {
            case 'home':
              posts = this.shufflePosts(posts);
              break;
            case 'hot':
              posts.sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
              break;
            case 'top':
              posts.sort((a, b) => b.upvotes - a.upvotes);
              break;
            case 'new':
              posts.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              );
              break;
          }

          this.posts.set(posts);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load posts', error);
          this.posts.set([]);
          this.isLoading.set(false);
        },
      });
  }

  private getSortParam(filter: FeedFilter): 'new' | 'hot' | 'top' {
    switch (filter) {
      case 'top':
        return 'top';
      case 'hot':
        return 'new';
      default:
        return 'new';
    }
  }

  private shufflePosts(posts: Post[]): Post[] {
    const shuffled = [...posts];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getFeedTitle(filter: FeedFilter): string {
    switch (filter) {
      case 'hot':
        return '🔥 Hot posts (most discussed)';
      case 'new':
        return '🆕 Latest memes';
      case 'top':
        return '📈 Top upvoted memes';
      default:
        return '🏠 Home feed';
    }
  }

  setFilter(filter: FeedFilter) {
    if (filter === this.currentFilter()) return;
    if (filter === 'home') {
      void this.router.navigate(['/feed']);
    } else {
      void this.router.navigate(['/feed', filter]);
    }
  }
}