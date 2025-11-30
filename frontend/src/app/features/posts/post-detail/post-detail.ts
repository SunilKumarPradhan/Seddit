import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoteButtons } from '../../../shared/components/vote-buttons/vote-buttons';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { CommentForm } from '../../comments/comment-form/comment-form';
import { CommentThread } from '../../comments/comment-thread/comment-thread';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { PostService } from '../services/post';
import { CommentService } from '../../comments/services/comment';
import { Post } from '../../../core/models/post.model';
import { Comment } from '../../../core/models/comment.model';
import { Auth } from '../../../core/services/auth';
import { FavoriteState } from '../../../core/services/favorite';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    VoteButtons,
    UserAvatar,
    CommentForm,
    CommentThread,
    LoadingSpinner,
  ],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);
  private readonly commentService = inject(CommentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(Auth);
  private readonly favoriteState = inject(FavoriteState);

  readonly post = signal<Post | null>(null);
  readonly comments = signal<Comment[]>([]);
  readonly isLoading = signal(true);
  readonly isFavorite = signal(false);
  readonly commentSort = signal<'best' | 'new' | 'top'>('best');
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly canModerate = computed(() => {
    const currentUser = this.auth.user();
    const postData = this.post();

    if (!currentUser || !postData) return false;

    return currentUser.id === postData.userId || currentUser.role === 'admin';
  });

  ngOnInit() {
    const postId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPost(postId);
    this.loadComments(postId);
  }

  private loadPost(id: number) {
    this.postService
      .getOne(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.post.set(post);
          this.isFavorite.set(post.isFavorited);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load post', error);
          this.post.set(null);
          this.isLoading.set(false);
        },
      });
  }

  private loadComments(postId: number) {
    this.commentService
      .getTree(postId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          const commentsWithOp = comments.map(comment =>
            this.markOp(comment, this.post()?.userId ?? 0)
          );
          this.comments.set(commentsWithOp);
        },
        error: (error) => {
          console.error('Failed to load comments', error);
          this.comments.set([]);
        },
      });
  }

  private markOp(comment: Comment, opUserId: number): Comment {
    return {
      ...comment,
      isOp: comment.userId === opUserId,
      replies: comment.replies.map(reply => this.markOp(reply, opUserId)),
    };
  }

  handlePostVote(vote: 'up' | 'down') {
    const currentPost = this.post();
    if (!currentPost) return;

    const currentVote = currentPost.userVote;

    if (currentVote === vote) {
      this.postService.removeVote(currentPost.id).subscribe({
        next: () => this.loadPost(currentPost.id),
        error: (err) => console.error('Failed to remove vote', err),
      });
    } else {
      this.postService.vote(currentPost.id, vote).subscribe({
        next: () => this.loadPost(currentPost.id),
        error: (err) => console.error('Failed to vote', err),
      });
    }
  }

  toggleFavorite() {
    const currentPost = this.post();
    if (!currentPost) return;

    const currentFavoriteState = this.isFavorite();

    if (currentFavoriteState) {
      this.postService.unfavorite(currentPost.id).subscribe({
        next: () => {
          this.isFavorite.set(false);
          if (currentPost) currentPost.isFavorited = false;
          this.favoriteState.notifyChange(); // ✅ Notify change
        },
        error: (err) => {
          console.error('Failed to unfavorite', err);
          alert('Failed to remove bookmark. Please try again.');
        },
      });
    } else {
      this.postService.favorite(currentPost.id).subscribe({
        next: () => {
          this.isFavorite.set(true);
          if (currentPost) currentPost.isFavorited = true;
          this.favoriteState.notifyChange(); // ✅ Notify change
        },
        error: (err) => {
          console.error('Failed to favorite', err);
          alert('Failed to bookmark. Please try again.');
        },
      });
    }
  }

  share() {
    const currentPost = this.post();
    if (!currentPost) return;

    if (navigator.share) {
      navigator.share({
        title: currentPost.title,
        text: currentPost.description ?? '',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  }

  addComment(content: string) {
    const currentPost = this.post();
    if (!currentPost) return;

    this.commentService.create(currentPost.id, content).subscribe({
      next: () => {
        this.loadComments(currentPost.id);
        currentPost.commentCount++;
      },
      error: (err) => console.error('Failed to add comment', err),
    });
  }

  handleCommentReply(event: { commentId: number; content: string }) {
    const currentPost = this.post();
    if (!currentPost) return;

    this.commentService
      .create(currentPost.id, event.content, event.commentId)
      .subscribe({
        next: () => {
          this.loadComments(currentPost.id);
          currentPost.commentCount++;
        },
        error: (err) => console.error('Failed to reply to comment', err),
      });
  }

  handleCommentVote(event: { commentId: number; voteType: 'up' | 'down' }) {
    this.commentService.vote(event.commentId, event.voteType).subscribe({
      next: () => {
        const currentPost = this.post();
        if (currentPost) {
          this.loadComments(currentPost.id);
        }
      },
      error: (err) => console.error('Failed to vote on comment', err),
    });
  }

  handleCommentDelete(commentId: number) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.commentService.delete(commentId).subscribe({
      next: () => {
        const currentPost = this.post();
        if (currentPost) {
          this.loadComments(currentPost.id);
          currentPost.commentCount--;
        }
      },
      error: (err) => console.error('Failed to delete comment', err),
    });
  }

  changeCommentSort(sortBy: 'best' | 'new' | 'top') {
    this.commentSort.set(sortBy);
    const currentPost = this.post();
    if (currentPost) {
      this.loadComments(currentPost.id);
    }
  }

  deletePost() {
    const currentPost = this.post();
    if (!currentPost) return;

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    this.postService.delete(currentPost.id).subscribe({
      next: () => {
        alert('Post deleted successfully');
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        console.error('Failed to delete post', err);
        alert('Failed to delete post. Please try again.');
      },
    });
  }

  formatTime(isoDate: string): string {
    const date = new Date(isoDate);
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString();
  }
}