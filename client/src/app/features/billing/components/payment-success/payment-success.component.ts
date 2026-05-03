import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css'],
})
export class PaymentSuccessComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentSuccessComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message?: string; session_id?: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
