import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'recruiter/my-jobs',
    loadComponent: () => import('./recruiter/my-jobs/my-jobs.component').then(m => m.MyJobsComponent)
  },
  {
    path: 'candidate/jobs',
    loadComponent: () => import('./candidate/jobs/jobs.component').then(m => m.JobsComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
