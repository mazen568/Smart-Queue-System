import { Component, EventEmitter, Input, Output, HostListener, ChangeDetectorRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title" *ngIf="title">{{ title }}</h3>
          <button class="close-btn" (click)="onClose()" aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <ng-content></ng-content>
        </div>

        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[footer]"></ng-content>
          
          <ng-container *ngIf="primaryActionLabel">
            <button class="btn-secondary" (click)="onClose()" [disabled]="isPrimaryLoading">
              {{ secondaryActionLabel }}
            </button>
            <button class="btn-primary" (click)="onPrimaryAction()" [disabled]="isPrimaryDisabled || isPrimaryLoading">
              {{ isPrimaryLoading ? 'Processing...' : primaryActionLabel }}
            </button>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4, 1rem);
      animation: fade-in 0.2s ease-out;
    }

    .modal-container {
      background: var(--surface, #ffffff);
      border-radius: var(--radius-xl, 1rem);
      width: 100%;
      max-width: 540px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border, #e2e8f0);
      overflow: hidden;
      animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-header {
      padding: var(--space-6, 1.5rem);
      border-bottom: 1px solid var(--border, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: var(--foreground, #0f172a);
    }

    .close-btn {
      background: transparent;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--muted-foreground, #64748b);
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(0,0,0,0.05);
      color: var(--foreground, #0f172a);
    }

    .modal-body {
      padding: var(--space-6, 1.5rem);
      max-height: 70vh;
      overflow-y: auto;
    }

    .modal-footer {
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      background: var(--background, #f8fafc);
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      border-top: 1px solid var(--border, #e2e8f0);
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 0.6rem 1.2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scale-in {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ModalComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input() title = '';
  @Input() primaryActionLabel = '';
  @Input() secondaryActionLabel = 'Cancel';
  @Input() isPrimaryDisabled = false;
  @Input() isPrimaryLoading = false;
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() close = new EventEmitter<void>();
  @Output() primaryAction = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    this.cdr.detectChanges();
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }

  onPrimaryAction() {
    if (!this.isPrimaryDisabled && !this.isPrimaryLoading) {
      this.primaryAction.emit();
    }
  }

  onBackdropClick() {
    if (this.closeOnBackdrop) {
      this.onClose();
    }
  }
}
