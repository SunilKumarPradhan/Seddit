import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VoteButtons } from '../../../shared/components/vote-buttons/vote-buttons';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, VoteButtons, UserAvatar],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css'
})
export class PostCard {
  post = input.required<any>();
  userVote = signal<'up' | 'down' | null>(null);
  isFavorite = signal(false);
  
  constructor(private router: Router) {}
  
  navigateToPost() {
    this.router.navigate(['/post', this.post().id]);
  }
  
  handleVote(vote: 'up' | 'down') {
    console.log('Vote:', vote);
  }
  
  openComments(event: Event) {
    event.stopPropagation();
    this.navigateToPost();
  }
  
  share(event: Event) {
    event.stopPropagation();
    console.log('Share post');
  }
  
  toggleFavorite(event: Event) {
    event.stopPropagation();
    this.isFavorite.update(v => !v);
  }
  
  formatTime(date: string): string {
    return '2 hours ago';
  }
}