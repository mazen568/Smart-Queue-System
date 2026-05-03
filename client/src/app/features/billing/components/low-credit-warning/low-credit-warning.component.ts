import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-low-credit-warning',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="warning-banner" *ngIf="balance < 10">
      <mat-icon>warning</mat-icon>
      <span class="warning-text">Low credits! You have only {{ balance }} credits remaining.</span>
      <a href="/admin/billing" class="warning-action">Top up now</a>
    </div>
  `,
  styles: [`
    .warning-banner {
      background-color: rgba(245, 158, 11, 0.12);
      border: 1px solid var(--warning);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      color: var(--warning);
    }

    .warning-text {
      flex: 1;
      font-size: var(--body-size);
      font-weight: 500;
    }

    .warning-action {
      color: var(--warning);
      font-weight: 600;
      text-decoration: none;
      border-bottom: 2px solid var(--warning);
      cursor: pointer;
      transition: opacity 0.2s var(--ease-out-soft);
    }

    .warning-action:hover {
      opacity: 0.7;
    }

    mat-icon {
      font-size: 20px;
    }
  `]
})
export class LowCreditWarningComponent {
  @Input() balance = 0;
}
