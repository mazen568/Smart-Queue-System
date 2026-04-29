import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css',
})
export class ConfirmModalComponent {
  dialogService = inject(ConfirmDialogService);

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.dialogService.state().isOpen) {
      this.dialogService.onCancel();
    }
  }
}
