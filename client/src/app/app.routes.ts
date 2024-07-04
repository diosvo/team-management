import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    canActivate: [],
    loadComponent: () =>
      import('@tm/layouts/auth-layout/auth-layout.component').then(
        ({AuthLayoutComponent}) => AuthLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        canMatch: [], // PermissionGuard
        data: {
          permission: [],
        },
        title: 'Dashboard',
        loadComponent: () =>
          import('@tm/features/dashboard/dashboard.component').then(
            ({DashboardComponent}) => DashboardComponent,
          ),
      },
    ],
  },
  // Domain -> check authenticated guard
  // --> Passed: AuthLayout
  // --> NOT passed: PublicLayout
  {
    path: '',
    loadComponent: () =>
      import('@tm/layouts/public-layout/public-layout.component').then(
        ({PublicLayoutComponent}) => PublicLayoutComponent,
      ),
    // children: [
    //   {
    //     path: '',
    //     loadChildren: undefined, // SecurityModule
    //   },
    //   {
    //     path: 'not-authorized',
    //     loadChildren: undefined, // NotAuthorizedModule
    //   },
    // ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('@tm/layouts/404/404.component').then(
        ({PageNotFoundComponent}) => PageNotFoundComponent,
      ),
    title: '404 - Page Not Found',
  },
];
