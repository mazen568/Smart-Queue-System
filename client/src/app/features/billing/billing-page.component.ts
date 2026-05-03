import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { BillingApiService } from './services/billing-api.service';

import { LowCreditWarningComponent } from './components/low-credit-warning/low-credit-warning.component';
import { CreditBalanceComponent } from './components/credit-balance/credit-balance.component';
import { PaymentHistoryComponent } from './components/payment-history/payment-history.component';
import { PurchaseCreditsComponent } from './components/purchase-credits/purchase-credits.component';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    CreditBalanceComponent,
    LowCreditWarningComponent,
    PurchaseCreditsComponent,
    PaymentHistoryComponent,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './billing-page.component.html',
  styleUrls: ['./billing-page.component.css'],
})
export class BillingPageComponent implements OnInit {
  private billingApi = inject(BillingApiService);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  balance = signal(0);
  loading = signal(true);
  successMessage = signal('');

  ngOnInit(): void {
    this.loadBalance();
    // detect mock or success query params from checkout redirect
    this.route.queryParams.subscribe((q) => {
      if (q?.['mock_checkout'] || q?.['success']) {
        const msg = q?.['mock_checkout'] ? 'Mock payment completed — credits applied.' : 'Payment completed successfully.';
        this.successMessage.set(msg);
        // refresh balance to reflect applied credits
        this.loadBalance();
        // show snackbar and modal dialog
        try {
          this.snack.open(msg, 'Close', { duration: 6000 });
          this.dialog.open(PaymentSuccessComponent, { data: { message: msg, session_id: q?.['session_id'] } });
        } catch (e) {
          console.error('Failed to show payment success UI', e);
        }
      }
    });

    // Fallback: directly inspect the URL query string in case Angular route params are not available
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('mock_checkout') || sp.has('success')) {
        const msg = sp.has('mock_checkout') ? 'Mock payment completed — credits applied.' : 'Payment completed successfully.';
        this.successMessage.set(msg);
        this.loadBalance();
        this.snack.open(msg, 'Close', { duration: 6000 });
        this.dialog.open(PaymentSuccessComponent, { data: { message: msg, session_id: sp.get('session_id') } });
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }

  loadBalance() {
    this.loading.set(true);
    this.billingApi.getBalance().subscribe({
      next: (credit) => {
        this.balance.set(credit.balance);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
