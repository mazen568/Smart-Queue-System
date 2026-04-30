import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { User } from '../../../../types/user';
import { ModalComponent } from '../../../../shared/Components/modal/modal';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { AdminButtonComponent } from '../admin-button/admin-button';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AdminHeaderComponent, AdminButtonComponent],
  templateUrl: './staff.html',
  styleUrl: './staff.css'
})
export class StaffComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toastService = inject(ToastService);

  staff = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  showInviteModal = signal(false);
  showDeleteConfirm = signal(false);
  showResetModal = signal(false);
  
  selectedUser = signal<User | null>(null);
  fieldErrors = signal<{ name?: string, email?: string, password?: string }>({});
  
  formData = {
    name: '',
    email: '',
    password: ''
  };

  resetPasswordData = {
    password: ''
  };

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    this.loading.set(true);
    this.adminApi.getStaff().subscribe({
      next: (data) => {
        console.log(data);
        
        this.staff.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load staff list');
        this.loading.set(false);
      }
    });
  }

  toggleInviteModal() {
    this.showInviteModal.set(!this.showInviteModal());
    this.resetForm();
    this.fieldErrors.set({});
    if (this.showInviteModal()) {
      this.generatePassword();
    }
  }

  resetForm() {
    this.formData = { name: '', email: '', password: '' };
  }

  generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    if (this.showResetModal()) {
      this.resetPasswordData.password = pass;
    } else {
      this.formData.password = pass;
    }
  }

  inviteStaff() {
    const errors: { name?: string, email?: string, password?: string } = {};
    if (!this.formData.name) errors.name = 'Full name is required';
    if (!this.formData.email) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!this.formData.password) {
      errors.password = 'Password is required';
    } else if (this.formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      return;
    }

    this.fieldErrors.set({});

    this.saving.set(true);
    this.adminApi.createStaff(this.formData).subscribe({
      next: () => {
        this.loadStaff();
        this.toggleInviteModal();
        this.saving.set(false);
        this.toastService.success('Staff member invited successfully');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to invite staff');
        this.saving.set(false);
      }
    });
  }

  deleteStaff(user: User) {
    this.selectedUser.set(user);
    this.showDeleteConfirm.set(true);
  }

  confirmDelete() {
    const user = this.selectedUser();
    const userId = (user as any)._id || user?.id;
    if (!userId) return;

    this.saving.set(true);
    this.adminApi.deleteStaff(userId).subscribe({
      next: () => {
        this.loadStaff();
        this.showDeleteConfirm.set(false);
        this.selectedUser.set(null);
        this.saving.set(false);
        this.toastService.success('Staff member removed successfully');
      },
      error: () => {
        this.toastService.error('Failed to remove staff member');
        this.saving.set(false);
      }
    });
  }

  openResetModal(user: User) {
    this.selectedUser.set(user);
    this.resetPasswordData.password = '';
    this.showResetModal.set(true);
    this.generatePassword();
  }

  confirmResetPassword() {
    const user = this.selectedUser();
    const userId = (user as any)._id || user?.id;
    if (!userId || !this.resetPasswordData.password) return;

    this.saving.set(true);
    this.adminApi.resetStaffPassword(userId, this.resetPasswordData).subscribe({
      next: () => {
        this.showResetModal.set(false);
        this.selectedUser.set(null);
        this.saving.set(false);
        this.toastService.success('Password reset successfully');
      },
      error: () => {
        this.toastService.error('Failed to reset password');
        this.saving.set(false);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
