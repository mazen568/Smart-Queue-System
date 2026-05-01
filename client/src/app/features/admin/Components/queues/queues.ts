import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { Queue } from '../../../../types/queue';
import { ModalComponent } from '../../../../shared/Components/modal/modal';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { AdminButtonComponent } from '../admin-button/admin-button';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-queues',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AdminHeaderComponent, AdminButtonComponent],
  templateUrl: './queues.html',
  styleUrl: './queues.css'
})
export class QueuesComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmDialogService);

  queues = signal<Queue[]>([]);
  pagination = signal({ page: 1, total: 0, pages: 1 });
  searchQuery = signal('');
  limit = 10;

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  showAddForm = signal(false);
  editingQueue = signal<Queue | null>(null);
  queueToReset = signal<string | null>(null);
  queueToDelete = signal<string | null>(null);
  fieldErrors = signal<{ name?: string, avgServiceTime?: string }>({});
  formData = {
    name: '',
    avgServiceTime: 15
  };

  ngOnInit() {
    this.loadQueues();
  }

  loadQueues(page: number = 1) {
    this.loading.set(true);
    this.adminApi.getQueues(page, this.limit, this.searchQuery()).subscribe({
      next: (res) => {
        this.queues.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to load queues');
        this.loading.set(false);
      }
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.loadQueues(1);
  }

  nextPage() {
    if (this.pagination().page < this.pagination().pages) {
      this.loadQueues(this.pagination().page + 1);
    }
  }

  prevPage() {
    if (this.pagination().page > 1) {
      this.loadQueues(this.pagination().page - 1);
    }
  }

  toggleAddForm() {
    this.showAddForm.set(!this.showAddForm());
    this.editingQueue.set(null);
    this.resetForm();
    this.fieldErrors.set({});
  }

  resetForm() {
    this.formData = { name: '', avgServiceTime: 15 };
  }

  editQueue(queue: Queue) {
    this.editingQueue.set(queue);
    this.formData = {
      name: queue.name,
      avgServiceTime: queue.avgServiceTime
    };
    this.showAddForm.set(true);
  }

  saveQueue() {
    const errors: { name?: string, avgServiceTime?: string } = {};
    if (!this.formData.name) errors.name = 'Queue name is required';
    if (!this.formData.avgServiceTime || this.formData.avgServiceTime <= 0) {
      errors.avgServiceTime = 'Please enter a valid service time (min 1m)';
    }

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      return;
    }

    this.fieldErrors.set({});

    const op = this.editingQueue()
      ? this.adminApi.updateQueue(this.editingQueue()!._id, this.formData)
      : this.adminApi.createQueue(this.formData);

    this.saving.set(true);
    op.subscribe({
      next: () => {
        this.loadQueues();
        this.toggleAddForm();
        this.saving.set(false);
        this.toastService.success(`Queue ${this.editingQueue() ? 'updated' : 'created'} successfully`);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to save queue');
        this.saving.set(false);
      }
    });
  }

  deleteQueue(id: string) {
    this.queueToDelete.set(id);
    this.confirmService.confirm({
      title: 'Delete Queue',
      message: 'Are you sure you want to delete this queue? This will deactivate it and it will no longer be available for new tickets.',
      confirmText: 'Delete Queue',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.confirmDelete();
      }
    });
  }

  confirmDelete() {
    const id = this.queueToDelete();
    if (!id) return;

    this.adminApi.deleteQueue(id).subscribe({
      next: () => {
        this.loadQueues();
        this.queueToDelete.set(null);
        this.toastService.success('Queue deleted successfully');
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to delete queue')
    });
  }

  resetCounter(id: string) {
    this.queueToReset.set(id);
    this.confirmService.confirm({
      title: 'Reset Queue Counter',
      message: 'Are you sure you want to reset the current number to 0 for this queue?',
      confirmText: 'Reset Now',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.confirmReset();
      }
    });
  }

  confirmReset() {
    const id = this.queueToReset();
    if (!id) return;

    this.adminApi.resetQueue(id).subscribe({
      next: () => {
        this.loadQueues();
        this.queueToReset.set(null);
        this.toastService.success('Queue counter reset successfully');
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to reset queue')
    });
  }
}
