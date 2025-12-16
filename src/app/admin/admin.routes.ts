import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'requests',
        pathMatch: 'full',
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/join-requests/join-requests.page').then((m) => m.JoinRequestsPage),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.page').then((m) => m.UsersPage),
      },
      {
        path: 'invites',
        loadComponent: () =>
          import('./pages/invites/invites.page').then((m) => m.InvitesPage),
      },
    ],
  },
];
