import { inject, Injectable, signal, effect } from '@angular/core';
import { environment } from '../config/environment';
import { Auth } from './auth';

type Handler = (payload: unknown) => void;

@Injectable({ providedIn: 'root' })
export class Websocket {
  private readonly auth = inject(Auth);
  private socket: WebSocket | null = null;
  private readonly handlers = new Map<string, Set<Handler>>();
  private reconnectAttempts = 0;
  private readonly connecting = signal(false);

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
  }

  unregisterHandler(type: string, handler: Handler) {
    this.handlers.get(type)?.delete(handler);
  }

  send(message: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
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
      this.reconnectAttempts = 0;
      this.connecting.set(false);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data?.type ?? 'message';
        this.handlers.get(type)?.forEach((handler) => handler(data));
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.connecting.set(false);
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private scheduleReconnect() {
    if (!this.auth.isAuthenticated()) return;

    const delay = Math.min(30000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;

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
  }
}