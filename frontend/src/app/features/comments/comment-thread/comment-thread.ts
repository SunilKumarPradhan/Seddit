import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommentItem } from '../comment-item/comment-item';
import { Comment } from '../../../core/models/comment.model';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [CommentItem],
  templateUrl: './comment-thread.html',
  styleUrl: './comment-thread.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentThread {
  comments = input.required<Comment[]>();

  readonly reply = output<{ commentId: number; content: string }>();
  readonly vote = output<{ commentId: number; voteType: 'up' | 'down' }>();
  readonly delete = output<number>();

  handleReply(event: { commentId: number; content: string }) {
    this.reply.emit(event);
  }

  handleVote(event: { commentId: number; voteType: 'up' | 'down' }) {
    this.vote.emit(event);
  }

  handleDelete(commentId: number) {
    this.delete.emit(commentId);
  }
}