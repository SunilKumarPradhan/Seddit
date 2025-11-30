import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../config/environment';
import { getFirebaseAuth } from '../firebase/firebase';
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { lastValueFrom } from 'rxjs';
import { TokenResponse } from '../models/auth.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = environment.storageKeys.auth;

  private readonly userSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);
  private readonly readySignal = signal(false);
  private redirectUrl: string | null = null;

  readonly user = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly isReady = computed(() => this.readySignal());

  constructor() {
    this.restoreSession();
  }

  token(): string | null {
    return this.tokenSignal();
  }

  setRedirect(url: string) {
    this.redirectUrl = url;
  }

  async loginWithEmail(email: string, password: string) {
    const auth = this.ensureFirebase();
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    await this.exchangeFirebaseToken(credentials);
  }

  async signupWithEmail(username: string, email: string, password: string) {
    const auth = this.ensureFirebase();
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    await this.registerWithBackend(credentials, username);
  }

  async loginWithGoogle() {
    const auth = this.ensureFirebase();
    const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
    await this.exchangeFirebaseToken(credentials);
  }

  async loginWithGithub() {
    const auth = this.ensureFirebase();
    const credentials = await signInWithPopup(auth, new GithubAuthProvider());
    await this.exchangeFirebaseToken(credentials);
  }

  async logout() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    this.clearSession();
    await this.router.navigate(['/login']);
  }

  handleUnauthorized() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // ───────── helpers ───────── //

  private async registerWithBackend(credentials: UserCredential, username: string) {
    const idToken = await credentials.user.getIdToken();
    const email = credentials.user.email ?? this.buildFallbackEmail(credentials.user.uid);

    await lastValueFrom(
      this.http.post(`${environment.apiUrl}/auth/register`, {
        id_token: idToken,
        firebase_uid: credentials.user.uid,
        email,
        username,
        avatar_url: credentials.user.photoURL ?? null,
      }),
    );

    await this.exchangeFirebaseToken(credentials, false);
  }

  private async exchangeFirebaseToken(
    credentials: UserCredential,
    allowAutoRegister = true,
  ) {
    const idToken = await credentials.user.getIdToken();

    try {
      const response = await lastValueFrom(
        this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, { id_token: idToken }),
      );
      const user = this.mapUser(response.user);
      this.persistSession(response.access_token, user);
      await this.router.navigateByUrl(this.redirectUrl ?? '/feed');
      this.redirectUrl = null;
    } catch (error) {
      if (
        allowAutoRegister &&
        error instanceof HttpErrorResponse &&
        error.status === 404
      ) {
        const username = this.generateUsername(
          credentials.user.displayName,
          credentials.user.email,
        );
        await this.registerWithBackend(credentials, username);
        return;
      }
      throw error;
    }
  }

  private mapUser(user: TokenResponse['user']): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      bio: null,
      role: user.role ?? 'user',
      createdAt: new Date().toISOString(),
    };
  }

  private persistSession(token: string, user: User) {
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    localStorage.setItem(this.storageKey, JSON.stringify({ token, user }));
  }

  private restoreSession() {
    const cache = localStorage.getItem(this.storageKey);
    if (cache) {
      try {
        const parsed = JSON.parse(cache) as { token: string; user: User };
        this.tokenSignal.set(parsed.token);
        this.userSignal.set(parsed.user);
      } catch (error) {
        console.warn('Failed to restore session', error);
        this.clearSession();
      }
    }
    this.readySignal.set(true);
  }

  private clearSession() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(this.storageKey);
  }

  private ensureFirebase() {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured. Update environment.firebase.*');
    return auth;
  }

  private generateUsername(displayName?: string | null, email?: string | null): string {
    const sanitise = (value: string | null | undefined) =>
      value?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ?? '';

    let base = sanitise(displayName);
    if (base.length < 3) {
      base = sanitise(email?.split('@')[0]);
    }
    if (base.length < 3) {
      base = 'user';
    }

    const suffix = Math.floor(Math.random() * 10_000)
      .toString()
      .padStart(4, '0');

    return `${base}${suffix}`.slice(0, 20);
  }

  private buildFallbackEmail(uid: string): string {
    return `${uid}@placeholder.local`;
  }
}