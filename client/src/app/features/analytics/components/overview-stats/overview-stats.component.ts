import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalyticsApiService, OverviewStats } from '../../services/analytics-api.service';

@Component({
  selector: 'app-overview-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="stats-grid">
      <mat-card class="stat-card stat-0">
        <mat-card-content>
          <div class="stat-label">Today</div>
          <div class="stat-value" *ngIf="!loading()">
            {{ stats().today }}
          </div>
          <mat-spinner *ngIf="loading()" diameter="30"></mat-spinner>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card stat-1">
        <mat-card-content>
          <div class="stat-label">This Week</div>
          <div class="stat-value" *ngIf="!loading()">
            {{ stats().thisWeek }}
          </div>
          <mat-spinner *ngIf="loading()" diameter="30"></mat-spinner>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card stat-2">
        <mat-card-content>
          <div class="stat-label">This Month</div>
          <div class="stat-value" *ngIf="!loading()">
            {{ stats().thisMonth }}
          </div>
          <mat-spinner *ngIf="loading()" diameter="30"></mat-spinner>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      text-align: center;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      border-top: 4px solid #667eea;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.12);
    }

    .stat-0 { border-top-color: #667eea; }
    .stat-1 { border-top-color: #f093fb; }
    .stat-2 { border-top-color: #4facfe; }

    .stat-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 13px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .stat-value {
      font-size: 36px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-top: 12px;
    }
  `]
})
export class OverviewStatsComponent implements OnInit {
  analyticsService = inject(AnalyticsApiService);

  stats = signal<OverviewStats>({ today: 0, thisWeek: 0, thisMonth: 0 });
  loading = signal(true);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.analyticsService.getOverviewStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading overview stats:', err);
        this.loading.set(false);
      }
    });
  }
}
