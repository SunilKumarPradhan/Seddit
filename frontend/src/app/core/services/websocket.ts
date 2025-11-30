import { inject, Injectable, signal, effect } from '@angular/core';
import { environment } from '../config/environment';
import { Auth } from './auth';

type Handler = (payload: unknown) => void;

export interface VoteUpdate {
  postId: number;
  commentId?: number;
  upvotes: number;
  downvotes: number;
  userVotes: { [userId: number]: 'up' | 'down' | null };
}

@Injectable({ providedIn: 'root' })
export class Websocket {
  private readonly auth = inject(Auth);
  private socket: WebSocket | null = null;
  private readonly handlers = new Map<string, Set<Handler>>();
  private reconnectAttempts = 0;
  private readonly connecting = signal(false);
  private readonly connected = signal(false);

  readonly isConnected = this.connected.asReadonly();

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  registerHandler(type: string, handler: Handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    
    // If already connected, request current state
    if (this.connected() && type === 'vote') {
      this.send({ type: 'subscribe_votes' });
    }
  }

  unregisterHandler(type: string, handler: Handler) {
    this.handlers.get(type)?.delete(handler);
  }

  send(message: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, queuing message');
    }
  }

  private connect() {
    if (this.connecting() || this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = this.auth.token();
    if (!token) return;

    this.connecting.set(true);
    const url = new URL(environment.websocketUrl);
    url.searchParams.set('token', token);

    this.socket = new WebSocket(url.toString());

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.connecting.set(false);
      this.connected.set(true);
      
      // Subscribe to vote updates
      this.send({ type: 'subscribe_votes' });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data?.type ?? 'message';
        
        // Handle different message types
        this.handlers.get(type)?.forEach((handler) => handler(data));
        
        // Also handle vote updates specifically
        if (type === 'vote_update') {
          this.handlers.get('vote')?.forEach((handler) => handler(data));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.socket = null;
      this.connecting.set(false);
      this.connected.set(false);
      this.scheduleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
      this.socket?.close();
    };
  }

  private scheduleReconnect() {
    if (!this.auth.isAuthenticated()) return;
    
    const delay = Math.min(30000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    
    console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.auth.isAuthenticated()) {
        this.connect();
      }
    }, delay);
  }

  private disconnect() {
    this.handlers.clear();
    this.socket?.close();
    this.socket = null;
    this.reconnectAttempts = 0;
    this.connecting.set(false);
    this.connected.set(false);
  }
}