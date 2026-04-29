import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toasts',
  imports: [],
  templateUrl: './toasts.component.html',
  styleUrl: './toasts.component.css',
})
export class ToastsComponent {
  toastService = inject(ToastService);
}
