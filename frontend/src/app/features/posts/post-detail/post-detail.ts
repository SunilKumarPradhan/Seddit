import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoteButtons } from '../../../shared/components/vote-buttons/vote-buttons';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { CommentForm } from '../../comments/comment-form/comment-form';
import { CommentThread } from '../../comments/comment-thread/comment-thread';

@Component({
  selector: 'app-post-detail',
  imports: [
    RouterLink,
    FormsModule,
    VoteButtons,
    UserAvatar,
    LoadingSpinner,
    CommentForm,
    CommentThread
  ],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css'
})
export class PostDetail implements OnInit {
  post = signal<any>(null);
  comments = signal<any[]>([]);
  isLoading = signal(true);
  isFavorite = signal(false);
  isAuthenticated = signal(false); // Will connect to auth service
  commentSort = 'best';
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    const postId = this.route.snapshot.paramMap.get('id');
    this.loadPost(postId);
    this.loadComments(postId);
  }
  
  loadPost(postId: string | null) {
    // Mock data
    setTimeout(() => {
      this.post.set({
        id: postId,
        title: 'When you fix a bug but create 3 more',
        author: 'debugger420',
        imageUrl: 'https://via.placeholder.com/800x600',
        description: 'Every developer\'s nightmare... You think you\'ve solved the problem, but then QA comes back with a list of new issues.',
        upvotes: 1337,
        downvotes: 42,
        commentCount: 89,
        createdAt: new Date().toISOString(),
        tag: 'Programming'
      });
      this.isLoading.set(false);
    }, 500);
  }
  
  loadComments(postId: string | null) {
    // Mock data
    this.comments.set([
      {
        id: '1',
        author: 'coder123',
        content: 'This is so relatable! Happened to me yesterday.',
        upvotes: 45,
        downvotes: 2,
        createdAt: new Date(),
        replies: [
          {
            id: '2',
            author: 'dev_guru',
            content: 'Same here! The eternal struggle.',
            upvotes: 12,
            downvotes: 0,
            createdAt: new Date(),
            replies: []
          }
        ]
      }
    ]);
  }
  
  canModerate(): boolean {
    // Check if user is author or has moderator/admin role
    return false;
  }
  
  handleVote(vote: 'up' | 'down') {
    console.log('Vote:', vote);
  }
  
  toggleFavorite() {
    this.isFavorite.update(v => !v);
  }
  
  share() {
    // Implement share functionality
  }
  
  report() {
    // Implement report functionality
  }
  
  editPost() {
    // Implement edit functionality
  }
  
  deletePost() {
    // Implement delete functionality
  }
  
  addComment(content: string) {
    console.log('New comment:', content);
    // Add comment logic
  }
  
  formatTime(date: string): string {
    return '2 hours ago';
  }
}