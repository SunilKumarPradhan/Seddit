import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vote-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote-buttons.html',
  styleUrl: './vote-buttons.css'
})
export class VoteButtons {
  upvotes = input.required<number>();
  downvotes = input.required<number>();
  userVote = input<'up' | 'down' | null>(null);
  orientation = input<'vertical' | 'horizontal'>('vertical');
  
  vote = output<'up' | 'down'>();
  
  voteCount = computed(() => {
    return this.upvotes() - this.downvotes();
  });
  
  handleVote(voteType: 'up' | 'down') {
    this.vote.emit(voteType);
  }
  
  formatVoteCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }
}