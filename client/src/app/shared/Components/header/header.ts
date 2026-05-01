import { Component, computed, inject } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = computed(() => this.auth.getCurrentUser());

  currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

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

  isAtDashboard = computed(() => {
    const url = this.currentUrl() || '';
    const role = this.user()?.role;
    if (role === 'admin') return url.startsWith('/admin');
    if (role === 'reception') return url.startsWith('/reception');
    return url.startsWith('/patient');
  });

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
