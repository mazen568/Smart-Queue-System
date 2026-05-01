import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../services/admin-api.service';
import { AuditLog } from '../../../../types/dashboard';
import { AdminHeaderComponent } from '../admin-header/admin-header';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, AdminHeaderComponent],
  templateUrl: './activity.html',
  styleUrl: './activity.css'
})
export class ActivityComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  logs = signal<AuditLog[]>([]);
  pagination = signal({ page: 1, total: 0, pages: 1 });
  loading = signal(true);
  limit = 20;

  ngOnInit() {
    this.loadActivity();
  }

  loadActivity(page: number = 1) {
    this.loading.set(true);
    this.adminApi.getActivity(page, this.limit).subscribe({
      next: (res) => {
        this.logs.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  nextPage() {
    if (this.pagination().page < this.pagination().pages) {
      this.loadActivity(this.pagination().page + 1);
    }
  }

  prevPage() {
    if (this.pagination().page > 1) {
      this.loadActivity(this.pagination().page - 1);
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'CREATE_QUEUE': return 'add_circle';
      case 'UPDATE_QUEUE': return 'settings';
      case 'DELETE_QUEUE': return 'delete';
      case 'RESET_QUEUE': return 'restart_alt';
      case 'CREATE_STAFF': return 'person_add';
      case 'DELETE_STAFF': return 'person_remove';
      case 'RESET_PASSWORD': return 'lock_reset';
      case 'UPDATE_SETTINGS': return 'tune';
      case 'CALL_TICKET': return 'campaign';
      case 'COMPLETE_TICKET': return 'check_circle';
      default: return 'info';
    }
  }

  getActionClass(action: string): string {
    if (action.startsWith('CREATE')) return 'action-create';
    if (action.startsWith('DELETE')) return 'action-delete';
    if (action.includes('RESET')) return 'action-reset';
    if (action.includes('TICKET')) return 'action-ticket';
    return 'action-default';
  }
}
