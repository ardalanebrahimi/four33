import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.parseUrl('/auth');
};

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: '',
    loadChildren: () =>
      import('./tabs/tabs.routes').then((m) => m.tabsRoutes),
    canActivate: [authGuard],
  },
  {
    path: 'recording/:id',
    loadComponent: () =>
      import('./pages/recording-detail/recording-detail.page').then(
        (m) => m.RecordingDetailPage
      ),
  },
  {
    path: 'tag/:name',
    loadComponent: () =>
      import('./pages/tag-detail/tag-detail.page').then((m) => m.TagDetailPage),
  },
  {
    path: 'user/:id',
    loadComponent: () =>
      import('./pages/user-profile/user-profile.page').then(
        (m) => m.UserProfilePage
      ),
  },
  {
    path: 'playback',
    loadComponent: () =>
      import('./pages/playback/playback.page').then((m) => m.PlaybackPage),
  },
  {
    path: 'tags-input',
    loadComponent: () =>
      import('./pages/tags-input/tags-input.page').then((m) => m.TagsInputPage),
  },
];
