import { Component, signal, OnInit } from '@angular/core';
import { PostCard } from '../../features/posts/post-card/post-card';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-feed',
  imports: [PostCard, LoadingSpinner],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class Feed implements OnInit {
  posts = signal<any[]>([]);
  currentFilter = signal<'hot' | 'new' | 'top'>('hot');
  isLoading = signal(false);
  
  ngOnInit() {
    this.loadPosts();
  }
  
  loadPosts() {
    // Mock data for now
    this.posts.set([
      {
        id: 1,
        title: 'When you fix a bug but create 3 more',
        author: 'debugger420',
        imageUrl: 'https://via.placeholder.com/600x400',
        description: 'Story of my life...',
        upvotes: 1337,
        downvotes: 42,
        commentCount: 89,
        createdAt: new Date().toISOString(),
        tag: 'Programming'
      },
      {
        id: 2,
        title: 'Me trying to center a div',
        author: 'css_warrior',
        imageUrl: 'https://via.placeholder.com/600x400',
        upvotes: 420,
        downvotes: 13,
        commentCount: 34,
        createdAt: new Date().toISOString(),
        tag: 'WebDev'
      }
    ]);
  }
  
  setFilter(filter: 'hot' | 'new' | 'top') {
    this.currentFilter.set(filter);
    this.loadPosts();
  }
  
  getFeedTitle(): string {
    return 'Popular Memes';
  }
}