import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  removing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  showToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const newToast: Toast = {
      id: crypto.randomUUID(),
      message,
      type,
      removing: false
    };

    this.toasts.update(current => [...current, newToast]);

    // Start exit animation before removing
    setTimeout(() => {
      this.toasts.update(current =>
        current.map(t => t.id === newToast.id ? { ...t, removing: true } : t)
      );
    }, duration - 400);

    setTimeout(() => {
      this.removeToast(newToast.id);
    }, duration);
  }

  removeToast(id: string) {
    // Trigger exit animation first, then remove
    this.toasts.update(current =>
      current.map(t => t.id === id ? { ...t, removing: true } : t)
    );

    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, 350);
  }

  // Convenience methods
  success(message: string) { this.showToast(message, 'success'); }
  error(message: string) { this.showToast(message, 'error', 5000); }
  warning(message: string) { this.showToast(message, 'warning'); }
  info(message: string) { this.showToast(message, 'info'); }
}
