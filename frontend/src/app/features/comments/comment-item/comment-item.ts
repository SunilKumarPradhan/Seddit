import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { VoteButtons } from '../../../shared/components/vote-buttons/vote-buttons';
import { CommentForm } from '../comment-form/comment-form';

@Component({
  selector: 'app-comment-item',
  imports: [RouterLink, NgIf, UserAvatar, VoteButtons, CommentForm],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css'
})
export class CommentItem {
  // Inputs
  comment = input.required<any>();
  depth = input<number>(0);
  
  // Outputs
  reply = output<{commentId: string, content: string}>();
  vote = output<{commentId: string, voteType: 'up' | 'down'}>();
  delete = output<string>();
  
  // Local state
  showReplyForm = signal(false);
  
  // Toggle reply form visibility
  toggleReply() {
    this.showReplyForm.update(v => !v);
  }
  
  // Submit a reply to this comment
  submitReply(content: string) {
    this.reply.emit({
      commentId: this.comment().id,
      content
    });
    this.showReplyForm.set(false);
  }
  
  // Handle vote button click for this comment
  onVoteClick(voteType: 'up' | 'down') {
    this.vote.emit({
      commentId: this.comment().id,
      voteType
    });
  }
  
  // Handle nested reply event from child comments
  onNestedReply(event: {commentId: string, content: string}) {
    // Pass the event up to parent
    this.reply.emit(event);
  }
  
  // Handle nested vote event from child comments
  onNestedVote(event: {commentId: string, voteType: 'up' | 'down'}) {
    // Pass the event up to parent
    this.vote.emit(event);
  }
  
  // Handle nested delete event from child comments
  onNestedDelete(commentId: string) {
    // Pass the event up to parent
    this.delete.emit(commentId);
  }
  
  // Delete this comment
  deleteComment() {
    this.delete.emit(this.comment().id);
  }
  
  // Report this comment
  reportComment() {
    console.log('Report comment:', this.comment().id);
    // TODO: Implement report functionality
  }
  
  // Check if current user can moderate
  canModerate(): boolean {
    // TODO: Check if user has permission to delete
    // This should check against the auth service
    return false;
  }
  
  // Format timestamp
  formatTime(date: Date): string {
    const now = new Date();
    const commentDate = new Date(date);
    const diff = now.getTime() - commentDate.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}