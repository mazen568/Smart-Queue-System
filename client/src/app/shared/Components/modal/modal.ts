import { Component, EventEmitter, Input, Output, HostListener, ChangeDetectorRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
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
