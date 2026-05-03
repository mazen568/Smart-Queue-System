import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { UserDTO } from '../../../../types/auth.dto';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isSubmitting = signal(false);
  serverError = signal<string | null>(null);
  showPassword = signal(false);
  rememberMe = signal(false);

  returnUrl = computed(() => this.route.snapshot.queryParamMap.get('returnUrl'));

  form = this.fb.nonNullable.group({
    email: [this.getSavedEmail(), [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [this.getSavedEmail() !== ''],
  });

  private getSavedEmail(): string {
    return localStorage.getItem('rememberedEmail') || '';
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res: UserDTO) => {
        if (this.form.controls.remember.value) {
          localStorage.setItem('rememberedEmail', this.form.controls.email.value);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        const redirect = this.returnUrl() || this.defaultDashboardForRole(res.user.role);
        this.router.navigateByUrl(redirect, { replaceUrl: true });
      },
      error: (err) => {
        const message =
          // err?.error?.message ||
          // err?.message ||
          'Login failed. Please check your credentials and try again.';
        this.serverError.set(message);
        this.isSubmitting.set(false);
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

  private defaultDashboardForRole(role: string) {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'reception') return '/reception/dashboard';
    return '/patient/clinics';
  }
}
