import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DateRangePickerComponent} from './components/date-range-picker/date-range-picker.component';
import {OverviewStatsComponent} from './components/overview-stats/overview-stats.component';
import { DailyTicketsChartComponent } from './components/daily-tickets-chart/daily-tickets-chart.component';
import { PeakHoursChartComponent } from './components/peak-hours-chart/peak-hours-chart.component';


@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [
CommonModule,
    DateRangePickerComponent,
    OverviewStatsComponent,
    DailyTicketsChartComponent,
    PeakHoursChartComponent,
  ],
  templateUrl: './analytics-page.component.html',
  styleUrls: ['./analytics-page.component.css']
})
export class AnalyticsPageComponent {
  dateRange = signal<{ from: Date; to: Date } | null>(this.getDefaultDateRange());

  private getDefaultDateRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    return { from, to };
  }

  onDateRangeChange(range: { from: Date; to: Date }) {
    this.dateRange.set(range);
  }
}
