import { Routes } from '@angular/router';
import { Feed } from './pages/feed/feed';
import { Login } from './features/auth/login/login';
import { Signup } from './features/auth/signup/signup';
import { PostDetail } from './features/posts/post-detail/post-detail';
import { PostCreate } from './features/posts/post-create/post-create';
import { Profile } from './features/user/profile/profile';
import { Settings } from './features/user/settings/settings';
import { SavedPosts } from './pages/saved-posts/saved-posts';
import { Category } from './pages/category/category'; // ✅ ADD THIS
import { NotFound } from './pages/not-found/not-found';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/feed', pathMatch: 'full' },

  { path: 'feed', component: Feed, canActivate: [authGuard] },
  { path: 'feed/:filter', component: Feed, canActivate: [authGuard] },
  { path: 'post/:id', component: PostDetail, canActivate: [authGuard] },
  { path: 'create-post', component: PostCreate, canActivate: [authGuard] },
  { path: 'saved', component: SavedPosts, canActivate: [authGuard] },
  { path: 'category/:slug', component: Category, canActivate: [authGuard] }, // ✅ ADD THIS
  { path: 'profile/:username', component: Profile, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },

  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'signup', component: Signup, canActivate: [guestGuard] },

  { path: '**', component: NotFound, canActivate: [authGuard] },
];