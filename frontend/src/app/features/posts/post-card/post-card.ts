import { ChangeDetectionStrategy, Component, inject, input, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VoteButtons } from '../../../shared/components/vote-buttons/vote-buttons';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { Post } from '../../../core/models/post.model';
import { PostService } from '../services/post';
import { FavoriteState } from '../../../core/services/favorite';
import { VoteState } from '../../../core/services/vote-state';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, VoteButtons, UserAvatar],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCard {
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);
  private readonly favoriteState = inject(FavoriteState);
  private readonly voteState = inject(VoteState);

  post = input.required<Post>();
  isFavorite = signal(false);

  readonly currentUpvotes = computed(() => {
    const voteCache = this.voteState.getPostVote(this.post().id);
    return voteCache?.upvotes ?? this.post().upvotes;
  });

  readonly currentDownvotes = computed(() => {
    const voteCache = this.voteState.getPostVote(this.post().id);
    return voteCache?.downvotes ?? this.post().downvotes;
  });

  readonly currentUserVote = computed(() => {
    const voteCache = this.voteState.getPostVote(this.post().id);
    return voteCache?.userVote ?? this.post().userVote;
  });

  readonly isVotePending = computed(() => {
    return this.voteState.isPending('post', this.post().id);
  });

  constructor() {
    effect(() => {
      this.isFavorite.set(this.post().isFavorited);
    }, { allowSignalWrites: true });
  }

  navigateToPost() {
    this.router.navigate(['/post', this.post().id]);
  }

  handleVote(vote: 'up' | 'down') {
    if (this.isVotePending()) return; // Prevent double-clicking

    const currentVote = this.currentUserVote();
    
    if (currentVote === vote) {
      // Remove vote
      this.postService.removeVote(this.post().id, currentVote).subscribe({
        error: (err) => {
          console.error('Failed to remove vote', err);
          // Revert optimistic update
          this.voteState.optimisticVote('post', this.post().id, currentVote, null);
        },
      });
    } else {
      // Add or change vote
      this.postService.vote(this.post().id, vote, currentVote).subscribe({
        error: (err) => {
          console.error('Failed to vote', err);
          // Revert optimistic update
          this.voteState.optimisticVote('post', this.post().id, currentVote, vote);
        },
      });
    }
  }

  openComments(event: Event) {
    event.stopPropagation();
    this.navigateToPost();
  }

  share(event: Event) {
    event.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: this.post().title,
        text: this.post().description ?? '',
        url: `${window.location.origin}/post/${this.post().id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${this.post().id}`);
      alert('Link copied to clipboard!');
    }
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();

    const currentPost = this.post();
    const currentFavoriteState = this.isFavorite();

    // Call API first, then update UI based on response
    if (currentFavoriteState) {
      this.postService.unfavorite(currentPost.id).subscribe({
        next: () => {
          this.isFavorite.set(false);
          currentPost.isFavorited = false;
          this.favoriteState.notifyChange(); // ✅ Notify change
          console.log('Post unfavorited successfully');
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
          currentPost.isFavorited = true;
          this.favoriteState.notifyChange(); // ✅ Notify change
          console.log('Post favorited successfully');
        },
        error: (err) => {
          console.error('Failed to favorite', err);
          alert('Failed to bookmark. Please try again.');
        },
      });
    }
  }

  formatTime(isoDate: string) {
    const date = new Date(isoDate);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}