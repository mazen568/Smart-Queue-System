import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillingApiService, Payment } from '../../services/billing-api.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="payment-card">
      <mat-card-header>
        <mat-card-title class="title">Payment History</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="loading()" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!loading() && payments().length === 0" class="empty-state">
          <p>No payments yet</p>
        </div>

        <table
          mat-table
          [dataSource]="payments()"
          *ngIf="!loading() && payments().length > 0"
          class="payments-table"
        >
          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let element">
              {{ element.createdAt | date: 'short' }}
            </td>
          </ng-container>

          <!-- Amount Column -->
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let element">{{ element.credits === 50 ? "99" : element.credits === 1000 ? "189" : "349" }} EGP</td>
          </ng-container>

          <!-- Credits Column -->
          <ng-container matColumnDef="credits">
            <th mat-header-cell *matHeaderCellDef>Credits</th>
            <td mat-cell *matCellDef="let element">{{ element.credits }}</td>
          </ng-container>

          <!-- Method Column -->
          <ng-container matColumnDef="method">
            <th mat-header-cell *matHeaderCellDef>Method</th>
            <td mat-cell *matCellDef="let element">{{ element.method }}</td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let element">
              <span [ngClass]="'status-' + element.status">
                {{ element.status | titlecase }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          *ngIf="!loading() && payments().length > 0"
          [length]="total()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="onPageChange($event)"
        ></mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .payment-card {
      //max-width: 1000px;
      margin: 0 auto;
      //border: 1px solid var(--border);
      background: var(--surface);
    }


    mat-card-header {
      background: var(--surface-elevated);
      //border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--muted-foreground);
    }

    .payments-table {
      width: 100%;
    }

    th {
      background: var(--surface-elevated) !important;
      color: var(--foreground) !important;
      font-weight: 600 !important;
    }

    td {
      border-bottom: 1px solid var(--border) !important;
      color: var(--foreground) !important;
    }

    .status-completed {
      background-color: rgba(46, 184, 114, 0.12);
      color: var(--success);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-size: var(--caption-size);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pending {
      background-color: rgba(245, 158, 11, 0.12);
      color: var(--warning);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-size: var(--caption-size);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-failed {
      background-color: rgba(229, 72, 77, 0.12);
      color: var(--danger);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-size: var(--caption-size);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  billingService = inject(BillingApiService);

  payments = signal<Payment[]>([]);
  total = signal(0);
  loading = signal(true);
  pageSize = 10;
  currentPage = 1;

  displayedColumns: string[] = ['date', 'amount', 'credits', 'method', 'status'];

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading.set(true);
    this.billingService.getPaymentHistory(this.currentPage, this.pageSize).subscribe({
      next: (data: { data: Payment[]; total: number; page: number }) => {
        this.payments.set(data.data);
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading payments:', err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }
}
