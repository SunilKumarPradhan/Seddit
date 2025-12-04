import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavoriteState {
  private readonly favoritesChanged = signal<number>(0);
  
  readonly changed = this.favoritesChanged.asReadonly();

  notifyChange() {
    this.favoritesChanged.update(v => v + 1);
  }
}