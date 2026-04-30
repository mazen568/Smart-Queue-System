import { Component, inject, OnInit, signal } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';
import { DashboardStats } from '../../../../types/dashboard';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth-service';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { ToastService } from '../../../../shared/services/toast.service';





@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AdminHeaderComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private adminApi = inject(AdminApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  user = this.authService.getCurrentUser();

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.adminApi.getOverviewStats().subscribe({
      next: (data) => {
        console.log(data);
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load overview stats');
        this.loading.set(false);
      }
    });
  }

  getBarWidth(waitingCount: number): number {
    return Math.min((waitingCount / 10) * 100, 100);
  }

  getBarClass(waitingCount: number): string {
    if (waitingCount >= 8) return 'bar-danger';
    if (waitingCount >= 4) return 'bar-warning';
    return 'bar-accent';
  }
}
