import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth-service';

@Component({
  selector: 'app-unauthorized',
  imports: [RouterLink],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.css',
})
export class Unauthorized {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = computed(() => this.auth.getCurrentUser());

  dashboardUrl = computed(() => {
    const role = this.user()?.role;
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'reception') return '/reception/dashboard';
    return '/';
  });

  dashboardLabel = computed(() => {
    const role = this.user()?.role;
    if (role === 'admin') return 'Admin Dashboard';
    if (role === 'reception') return 'Reception Dashboard';
    return 'Home';
  });

  goToDashboard() {
    this.router.navigateByUrl(this.dashboardUrl());
  }
}
