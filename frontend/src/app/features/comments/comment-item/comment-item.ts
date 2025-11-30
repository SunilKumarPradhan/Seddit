import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Comment } from '../../../core/models/comment.model';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { VoteButtons } from '../../../shared/components/vote-buttons/vote-buttons';
import { CommentForm } from '../comment-form/comment-form';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [RouterLink, UserAvatar, VoteButtons, CommentForm],
  templateUrl: './comment-item.html',
  styleUrls: ['./comment-item.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentItem {
  comment = input.required<Comment>();
  depth = input<number>(0);

  readonly reply = output<{ commentId: number; content: string }>();
  readonly vote = output<{ commentId: number; voteType: 'up' | 'down' }>();
  readonly delete = output<number>();

  readonly showReplyForm = signal(false);

  toggleReply() {
    this.showReplyForm.update((value) => !value);
  }

  submitReply(content: string) {
    this.reply.emit({ commentId: this.comment().id, content });
    this.showReplyForm.set(false);
  }

  onVoteClick(voteType: 'up' | 'down') {
    this.vote.emit({ commentId: this.comment().id, voteType });
  }

  onNestedReply(event: { commentId: number; content: string }) {
    this.reply.emit(event);
  }

  onNestedVote(event: { commentId: number; voteType: 'up' | 'down' }) {
    this.vote.emit(event);
  }

  onNestedDelete(commentId: number) {
    this.delete.emit(commentId);
  }

  deleteComment() {
    this.delete.emit(this.comment().id);
  }

  canModerate(): boolean {
    return false;
  }

  reportComment() {
    console.log('Report comment', this.comment().id);
  }

  formatTime(isoDate: string): string {
    const date = new Date(isoDate);
    const diffSeconds = (Date.now() - date.getTime()) / 1000;

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  }
}