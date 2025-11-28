import { Routes } from '@angular/router';
import { Feed } from './pages/feed/feed';
import { Login } from './features/auth/login/login';
import { Signup } from './features/auth/signup/signup';
import { PostDetail } from './features/posts/post-detail/post-detail';
import { PostCreate } from './features/posts/post-create/post-create';
import { Profile } from './features/user/profile/profile';
import { Settings } from './features/user/settings/settings';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  { path: 'feed', component: Feed },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'post/:id', component: PostDetail },
  { path: 'create-post', component: PostCreate },
  { path: 'profile/:username', component: Profile },
  { path: 'settings', component: Settings },
  { path: '**', component: NotFound }
];