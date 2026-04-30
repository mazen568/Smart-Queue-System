import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { Queue } from '../../../../types/queue';
import { ModalComponent } from '../../../../shared/Components/modal/modal';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { AdminButtonComponent } from '../admin-button/admin-button';
import { ToastService } from '../../../../shared/services/toast.service';

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

  queues = signal<Queue[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  showAddForm = signal(false);
  showResetConfirm = signal(false);
  showDeleteConfirm = signal(false);
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

  loadQueues() {
    this.loading.set(true);
    this.adminApi.getQueues().subscribe({
      next: (data) => {
        this.queues.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to load queues');
        this.loading.set(false);
      }
    });
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
    this.showDeleteConfirm.set(true);
  }

  confirmDelete() {
    const id = this.queueToDelete();
    if (!id) return;

    this.adminApi.deleteQueue(id).subscribe({
      next: () => {
        this.loadQueues();
        this.showDeleteConfirm.set(false);
        this.queueToDelete.set(null);
        this.toastService.success('Queue deleted successfully');
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to delete queue')
    });
  }

  resetCounter(id: string) {
    this.queueToReset.set(id);
    this.showResetConfirm.set(true);
  }

  confirmReset() {
    const id = this.queueToReset();
    if (!id) return;

    this.adminApi.resetQueue(id).subscribe({
      next: () => {
        this.loadQueues();
        this.showResetConfirm.set(false);
        this.queueToReset.set(null);
        this.toastService.success('Queue counter reset successfully');
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to reset queue')
    });
  }
}
