import { Component, inject, Input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ChartConfiguration } from 'chart.js';
import { AnalyticsApiService, PeakHourData } from '../../services/analytics-api.service';
import {NgChartsModule} from 'ng2-charts';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-peak-hours-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgChartsModule, MatProgressSpinner],
  template: `
    <mat-card class="chart-card">
      <mat-card-header class="card-header">
        <mat-card-title>Peak Hours Distribution</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <canvas
          baseChart
          [data]="chartData"
          [options]="chartOptions"
          type="bar"
          *ngIf="!loading()"
        ></canvas>
        <div class="loading" *ngIf="loading()"><mat-spinner diameter="40"></mat-spinner></div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chart-card {
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      border-radius: 12px;
    }

    .card-header {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      padding: 16px !important;
      border-radius: 12px 12px 0 0;
    }

    mat-card-title {
      margin: 0 !important;
      font-size: 18px;
      font-weight: 600;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px;
      min-height: 300px;
    }
  `]
})
export class PeakHoursChartComponent implements OnChanges {
  @Input() dateRange: { from: Date; to: Date } | null = null;

  analyticsService = inject(AnalyticsApiService);
  loading = signal(true);

  chartData: any = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Tickets',
        data: [],
        backgroundColor: '#667eea',
        hoverBackgroundColor: '#764ba2',
      }
    ]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dateRange'] && this.dateRange) {
      this.loadData();
    }
  }

  loadData() {
    if (!this.dateRange) return;

    this.loading.set(true);
    const from = this.dateRange.from.toISOString().split('T')[0];
    const to = this.dateRange.to.toISOString().split('T')[0];

    this.analyticsService.getPeakHours(from, to).subscribe({
      next: (data: PeakHourData[]) => {
        this.chartData.datasets[0].data = data.map(d => d.count);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading peak hours:', err);
        this.loading.set(false);
      }
    });
  }
}
