import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillingApiService, Credit } from '../../services/billing-api.service';

@Component({
  selector: 'app-credit-balance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './credit-balance.component.html',
  styleUrls: ['./credit-balance.component.css']
})
export class CreditBalanceComponent implements OnInit {
  billingService = inject(BillingApiService);
  private cd = inject(ChangeDetectorRef);
  balance = 0;
  loading = true;

  ngOnInit() {
    this.billingService.getBalance().subscribe({
      next: (data: Credit) => {
        this.balance = data.balance;
        this.loading = false;
        // avoid ExpressionChangedAfterItHasBeenCheckedError by triggering change detection
        try {
          this.cd.detectChanges();
        } catch (e) {
          // swallow in case change detector is destroyed in tests/teardown
        }
      },
      error: (err: any) => {
        console.error('Error fetching balance:', err);
        this.loading = false;
        try {
          this.cd.detectChanges();
        } catch (e) {}
      }
    });
  }
}
