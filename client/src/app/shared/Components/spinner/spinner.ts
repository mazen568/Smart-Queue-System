import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay" [class.absolute]="inline">
      <div class="spinner-container">
        <div class="spinner-ring">
          <div></div><div></div><div></div><div></div>
        </div>
        <p class="spinner-text" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fade-in 0.3s ease-out;
    }

    .spinner-overlay.absolute {
      position: absolute;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .spinner-ring {
      display: inline-block;
      position: relative;
      width: 80px;
      height: 80px;
    }

    .spinner-ring div {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 64px;
      height: 64px;
      margin: 8px;
      border: 6px solid var(--accent, #3b82f6);
      border-radius: 50%;
      animation: ring-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      border-color: var(--accent, #3b82f6) transparent transparent transparent;
    }

    .spinner-ring div:nth-child(1) { animation-delay: -0.45s; }
    .spinner-ring div:nth-child(2) { animation-delay: -0.3s; }
    .spinner-ring div:nth-child(3) { animation-delay: -0.15s; }

    .spinner-text {
      color: var(--foreground, #1e293b);
      font-weight: 600;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
    }

    @keyframes ring-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class SpinnerComponent {
  @Input() message = '';
  @Input() inline = false;
}
