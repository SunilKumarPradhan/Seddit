import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.css'
})
export class UserAvatar {
  size = input<number>(40);
  username = input<string>('');
  imageUrl = input<string>('');
  showOnlineStatus = input<boolean>(false);
  isOnline = input<boolean>(false);
  clickable = input<boolean>(false);
  
  click = output<void>();
  
  handleClick() {
    if (this.clickable()) {
      this.click.emit();
    }
  }
  
  getInitials(): string {
    const name = this.username();
    if (!name) return '?';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  }
  
  getAvatarColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFB6C1'
    ];
    
    const name = this.username();
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
}