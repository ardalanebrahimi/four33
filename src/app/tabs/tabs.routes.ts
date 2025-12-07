import { Routes } from '@angular/router';
import { TabsComponent } from './tabs.component';

export const tabsRoutes: Routes = [
  {
    path: '',
    component: TabsComponent,
    children: [
      {
        path: 'record',
        loadComponent: () =>
          import('../pages/record/record.page').then((m) => m.RecordPage),
      },
      {
        path: 'explore',
        loadComponent: () =>
          import('../pages/explore/explore.page').then((m) => m.ExplorePage),
      },
      {
        path: 'you',
        loadComponent: () =>
          import('../pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'record',
        pathMatch: 'full',
      },
    ],
  },
];
