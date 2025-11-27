import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  isCollapsed = signal(false);
  isAuthenticated = signal(false);
  
  categories = signal([
    { id: 1, name: 'Funny', emoji: '😂', slug: 'funny' },
    { id: 2, name: 'Gaming', emoji: '🎮', slug: 'gaming' },
    { id: 3, name: 'Programming', emoji: '💻', slug: 'programming' },
    { id: 4, name: 'Dank', emoji: '🌚', slug: 'dank' },
    { id: 5, name: 'Wholesome', emoji: '🥰', slug: 'wholesome' },
  ]);
}