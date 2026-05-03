import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BillingApiService } from '../../services/billing-api.service';
import { CreditPackageCardComponent } from '../credit-package-card/credit-package-card.component';

@Component({
  selector: 'app-purchase-credits',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CreditPackageCardComponent
  ],
  templateUrl: './purchase-credits.component.html',
  styleUrls: ['./purchase-credits.component.css']
})
export class PurchaseCreditsComponent {
  billingService = inject(BillingApiService);
  snackBar = inject(MatSnackBar);

  packages: Array<{ credits: 50 | 100 | 200; price: number }> = [
    { credits: 50, price: 99 },
    { credits: 100, price: 189 },
    { credits: 200, price: 349 },
  ];

  selectedCredits: 50 | 100 | 200 | 0 = 0;
  isLoading = signal(false);

  selectPackage(credits: number) {
    this.selectedCredits = credits as 50 | 100 | 200;
  }

  checkout() {
    if (!this.selectedCredits) return;

    this.isLoading.set(true);
    this.billingService.createStripeCheckout(this.selectedCredits).subscribe({
      next: (session) => {
        this.isLoading.set(false);
        if (session.checkoutUrl) {
          window.location.href = session.checkoutUrl;
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Payment failed. Please try again.', 'Close', { duration: 5000 });
        console.error('Checkout error:', err);
      }
    });
  }
}
