import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {environment} from '../../../../environments/environment';

export interface OverviewStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface DailyTicketData {
  date: string;
  count: number;
}

export interface WaitTimeData {
  queueName: string;
  avgWaitTime: number;
  ticketCount: number;
}

export interface PeakHourData {
  hour: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/analytics`;

  getOverviewStats(): Observable<OverviewStats> {
    return this.http.get<{ data: OverviewStats }>(`${this.apiUrl}/overview`).pipe(
      map(res => res.data)
    );
  }

  getDailyTickets(from: string, to: string): Observable<DailyTicketData[]> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<{ data: DailyTicketData[] }>(
      `${this.apiUrl}/daily`,
      { params }
    ).pipe(map(res => res.data));
  }

  getWaitTimePerQueue(): Observable<WaitTimeData[]> {
    return this.http.get<{ data: WaitTimeData[] }>(
      `${this.apiUrl}/wait-time`
    ).pipe(map(res => res.data));
  }

  getPeakHours(from: string, to: string): Observable<PeakHourData[]> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<{ data: PeakHourData[] }>(
      `${this.apiUrl}/peak-hours`,
      { params }
    ).pipe(map(res => res.data));
  }
}
