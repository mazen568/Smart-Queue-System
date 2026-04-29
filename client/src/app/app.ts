import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './shared/Components/toasts/toasts.component';
import { ConfirmModalComponent } from './shared/Components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('queue-system');
}
