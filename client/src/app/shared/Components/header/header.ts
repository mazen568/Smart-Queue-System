import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private auth = inject(AuthService);

  user = computed(() => this.auth.getCurrentUser());

  dashboardUrl = computed(() => {
    const role = this.user()?.role;
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'reception') return '/reception/dashboard';
    return '/patient/clinics';
  });

  dashboardLabel = computed(() => {
    const role = this.user()?.role;
    if (role === 'admin') return 'Admin Dashboard';
    if (role === 'reception') return 'Reception Dashboard';
    return 'Clinics';
  });
}
