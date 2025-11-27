import { Component, input, output } from '@angular/core';
import { CommentItem } from '../comment-item/comment-item';

@Component({
  selector: 'app-comment-thread',
  imports: [CommentItem],
  templateUrl: './comment-thread.html',
  styleUrl: './comment-thread.css'
})
export class CommentThread {
  comments = input.required<any[]>();
  
  reply = output<{commentId: string, content: string}>();
  vote = output<{commentId: string, voteType: 'up' | 'down'}>();
  delete = output<string>();
  
  handleReply(event: {commentId: string, content: string}) {
    this.reply.emit(event);
  }
  
  handleVote(event: {commentId: string, voteType: 'up' | 'down'}) {
    this.vote.emit(event);
  }
  
  handleDelete(commentId: string) {
    this.delete.emit(commentId);
  }
}