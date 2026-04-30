import { Routes } from '@angular/router';
import { Patient } from './layouts/patient/patient';
import { Auth } from './layouts/auth/auth';
import { Admin } from './layouts/admin/admin';
import { Reception } from './layouts/reception/reception';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'patient',
    pathMatch: 'full',
  },
  {
    path: 'join',
    loadComponent: () =>
      import('./features/patient/Components/join/join').then((c) => c.JoinComponent),
    title: 'Join Queue',
  },
  {
    path: 'patient',
    component: Patient,
    children: [
      {
        path: '',
        redirectTo: 'clinics',
        pathMatch: 'full',
      },
      {
        path: 'clinics',
        loadComponent: () =>
          import('./features/patient/Components/clinics/clinics').then((c) => c.ClinicsComponent),
      },
      {
        path: 'clinic/:id',
        loadComponent: () =>
          import('./features/patient/Components/clinic-detail/clinic-detail').then((c) => c.ClinicDetailComponent),
      },
      {
        path: 'ticket/:ticketId',
        loadComponent: () =>
          import('./features/patient/Components/ticket-status/ticket-status').then((c) => c.TicketStatusComponent),
      },
    ],
  },
  {
    path: 'auth',
    component: Auth,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () => import("./features/auth/Components/login/login").then(c => c.Login),
        title: 'Login'
      },
      {
        path: "register",
        loadComponent: () => import("./features/auth/Components/signup/signup").then(c => c.Signup),
        title: "register"
      }
    ],
  },
  {
    path: "admin",
    component: Admin,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
      },
      {
        path: "dashboard",
        loadComponent: () => import("./features/admin/Components/dashboard/dashboard").then(c => c.Dashboard),
        title: "Admin Dashboard"
      },
      {
        path: "queues",
        loadComponent: () => import("./features/admin/Components/queues/queues").then(c => c.QueuesComponent),
        title: "Manage Queues"
      },
      {
        path: "staff",
        loadComponent: () => import("./features/admin/Components/staff/staff").then(c => c.StaffComponent),
        title: "Manage Staff"
      },
      {
        path: "settings",
        loadComponent: () => import("./features/admin/Components/settings/settings").then(c => c.SettingsComponent),
        title: "Clinic Settings"
      },
      {
        path: "credits",
        loadComponent: () => import("./features/admin/Components/credits/credits").then(c => c.CreditsComponent),
        title: "Credits"
      }
    ]
  },
  {
    path: "reception",
    component: Reception,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['reception'] },
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
      },
      {
        path: "dashboard",
        loadComponent: () => import("./features/reception/Components/dashboard/dashboard").then(c => c.Dashboard)
      }
    ]
  },
  {
    path: "unauthorized",
    loadComponent: () => import("./shared/Components/unauthorized/unauthorized").then(c => c.Unauthorized),
    title: "Unauthorized access"
  },
  {
    path: "**",
    loadComponent: () => import("./shared/Components/not-found/not-found").then(c => c.NotFound),
    title: "Not Found"
  }
];
