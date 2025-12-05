import { Routes } from '@angular/router';
import { Feed } from './pages/feed/feed';
import { Login } from './features/auth/login/login';
import { Signup } from './features/auth/signup/signup';
import { PostDetail } from './features/posts/post-detail/post-detail';
import { PostCreate } from './features/posts/post-create/post-create';
import { Profile } from './features/user/profile/profile';
import { Settings } from './features/user/settings/settings';
import { SavedPosts } from './pages/saved-posts/saved-posts';
import { Category } from './pages/category/category';
import { NotFound } from './pages/not-found/not-found';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { adminGuard } from './core/guards/admin-guard';
import { moderatorGuard } from './core/guards/role-guard';

// ✅ Import admin components
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { AdminUsers } from './features/admin/admin-users/admin-users';
import { AdminPosts } from './features/admin/admin-posts/admin-posts';
import { AdminComments } from './features/admin/admin-comments/admin-comments';

export const routes: Routes = [
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  
  // Public routes
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'signup', component: Signup, canActivate: [guestGuard] },
  
  // Protected routes
  { path: 'feed', component: Feed, canActivate: [authGuard] },
  { path: 'feed/:filter', component: Feed, canActivate: [authGuard] },
  { path: 'post/:id', component: PostDetail, canActivate: [authGuard] },
  { path: 'create-post', component: PostCreate, canActivate: [authGuard] },
  { path: 'saved', component: SavedPosts, canActivate: [authGuard] },
  { path: 'category/:slug', component: Category, canActivate: [authGuard] },
  { path: 'profile/:username', component: Profile, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
  

  { path: 'admin', component: AdminDashboard, canActivate: [authGuard, adminGuard] },
  { path: 'admin/users', component: AdminUsers, canActivate: [authGuard, adminGuard] },
  { path: 'admin/posts', component: AdminPosts, canActivate: [authGuard, adminGuard] },
  { path: 'admin/comments', component: AdminComments, canActivate: [authGuard, adminGuard]},
  
  { path: 'mod/posts', component: AdminPosts, canActivate: [authGuard, moderatorGuard] },
  { path: 'mod/comments', component: AdminComments, canActivate: [authGuard, moderatorGuard] },
  
  // 404 - MUST BE LAST
  { path: '**', component: NotFound },
];