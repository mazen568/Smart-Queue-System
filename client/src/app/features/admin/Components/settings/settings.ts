import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { environment } from '../../../../../environments/environment';
import { Clinic } from '../../../../types/queue';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { AdminButtonComponent } from '../admin-button/admin-button';
import { ToastService } from '../../../../shared/services/toast.service';
import { getClinicLogoUrl } from '../../../../shared/utils/url-utils';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeaderComponent, AdminButtonComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toastService = inject(ToastService);
  
  clinic = signal<Clinic | null>(null);
  loading = signal(true);
  saving = signal(false);
  isReadingImage = signal(false);
  error = signal<string | null>(null);
  fieldErrors = signal<{ name?: string, address?: string }>({});

  formData = {
    name: '',
    description: '',
    address: '',
    logoUrl: ''
  };

  imagePreview = signal<string | null>(null);

  ngOnInit() {
    this.loadClinic();
  }

  loadClinic() {
    this.loading.set(true);
    this.adminApi.getClinicDetails().subscribe({
      next: (clinic) => {
        this.clinic.set(clinic);
        this.formData = {
          name: clinic.name || '',
          description: clinic.description || '',
          address: clinic.address || '',
          logoUrl: clinic.logoUrl || ''
        };
        this.imagePreview.set(this.getLogoUrl(clinic.logoUrl));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load clinic details.');
        this.loading.set(false);
      }
    });
  }

  getLogoUrl(url: string | null | undefined): string | null {
    return getClinicLogoUrl(url, environment.apiUrl, environment.production);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.error.set('Image size should be less than 2MB');
      return;
    }

    this.isReadingImage.set(true);
    this.adminApi.uploadClinicLogo(file).subscribe({
      next: (res) => {
        const fullUrl = this.getLogoUrl(res.logoUrl);
        this.imagePreview.set(fullUrl);
        this.formData.logoUrl = res.logoUrl; // Store relative path
        this.isReadingImage.set(false);
        event.target.value = '';
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to upload image.');
        this.isReadingImage.set(false);
      }
    });
  }

  saveClinic() {
    if (this.isReadingImage()) return;
    const errors: { name?: string, address?: string } = {};
    if (!this.formData.name) errors.name = 'Clinic name is required';
    if (!this.formData.address) errors.address = 'Clinic address is required';

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      return;
    }

    this.fieldErrors.set({});
    this.saving.set(true);

    this.adminApi.updateClinicDetails(this.formData).subscribe({
      next: (clinic) => {
        this.clinic.set(clinic);
        this.saving.set(false);
        this.toastService.success('Clinic profile updated successfully');
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to update clinic details');
        this.saving.set(false);
      }
    });
  }
}
