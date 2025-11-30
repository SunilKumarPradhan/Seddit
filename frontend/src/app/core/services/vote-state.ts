import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Websocket, VoteUpdate } from './websocket';
import { Auth } from './auth';

interface VoteCache {
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class VoteState {
  private readonly websocket = inject(Websocket);
  private readonly auth = inject(Auth);
  
  private readonly postVotes = signal<Map<number, VoteCache>>(new Map());
  private readonly commentVotes = signal<Map<number, VoteCache>>(new Map());
  private readonly pendingVotes = signal<Set<string>>(new Set());
  
  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.initializeWebSocket();
      }
    }, { allowSignalWrites: true });
  }

  private initializeWebSocket() {
    this.websocket.registerHandler('vote_update', (payload: unknown) => {
      this.handleVoteUpdate(payload as VoteUpdate);
    });
  }

  private handleVoteUpdate(update: VoteUpdate) {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const userVote = update.userVotes[userId] ?? null;
    const cache: VoteCache = {
      upvotes: update.upvotes,
      downvotes: update.downvotes,
      userVote,
      timestamp: Date.now()
    };

    if (update.commentId) {
      this.commentVotes.update(map => {
        const newMap = new Map(map);
        newMap.set(update.commentId!, cache);
        return newMap;
      });
    } else {
      this.postVotes.update(map => {
        const newMap = new Map(map);
        newMap.set(update.postId, cache);
        return newMap;
      });
    }

    // Clear pending vote for this item
    const voteKey = update.commentId 
      ? `comment-${update.commentId}`
      : `post-${update.postId}`;
    this.pendingVotes.update(set => {
      const newSet = new Set(set);
      newSet.delete(voteKey);
      return newSet;
    });
  }

  getPostVote(postId: number): VoteCache | null {
    return this.postVotes().get(postId) ?? null;
  }

  getCommentVote(commentId: number): VoteCache | null {
    return this.commentVotes().get(commentId) ?? null;
  }

  isPending(type: 'post' | 'comment', id: number): boolean {
    const key = `${type}-${id}`;
    return this.pendingVotes().has(key);
  }

  setPending(type: 'post' | 'comment', id: number, pending: boolean) {
    const key = `${type}-${id}`;
    this.pendingVotes.update(set => {
      const newSet = new Set(set);
      if (pending) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }

  // Optimistic update for immediate UI feedback
  optimisticVote(type: 'post' | 'comment', id: number, vote: 'up' | 'down' | null, currentVote: 'up' | 'down' | null) {
    const map = type === 'post' ? this.postVotes : this.commentVotes;
    const current = (type === 'post' ? this.getPostVote(id) : this.getCommentVote(id)) ?? {
      upvotes: 0,
      downvotes: 0,
      userVote: currentVote,
      timestamp: Date.now()
    };

    let newUpvotes = current.upvotes;
    let newDownvotes = current.downvotes;

    // Remove old vote
    if (currentVote === 'up') newUpvotes--;
    else if (currentVote === 'down') newDownvotes--;

    // Add new vote
    if (vote === 'up') newUpvotes++;
    else if (vote === 'down') newDownvotes++;

    const optimisticCache: VoteCache = {
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: vote,
      timestamp: Date.now()
    };

    map.update(m => {
      const newMap = new Map(m);
      newMap.set(id, optimisticCache);
      return newMap;
    });
  }
}