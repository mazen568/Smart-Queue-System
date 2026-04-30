import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';
import { Clinic, Queue } from '../../../types/queue';
import { User } from '../../../types/user';

import { DashboardStats, LiveQueue, TicketActivity } from '../../../types/dashboard';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  // --- Clinic Management ---
  getClinicDetails(): Observable<Clinic> {
    return this.http.get<{ data: Clinic }>(`${this.apiUrl}/clinic`).pipe(map(res => res.data));
  }

  updateClinicDetails(data: Partial<Clinic>): Observable<Clinic> {
    return this.http.put<{ data: Clinic }>(`${this.apiUrl}/clinic`, data).pipe(map(res => res.data));
  }

  uploadClinicLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ data: { logoUrl: string } }>(`${this.apiUrl}/clinic/logo`, formData).pipe(map(res => res.data));
  }

  updateClinicStatus(isActive: boolean): Observable<{ isActive: boolean }> {
    return this.http.patch<{ data: { isActive: boolean } }>(`${this.apiUrl}/clinic/status`, { isActive }).pipe(map(res => res.data));
  }

  // --- Queue Management ---
  getQueues(): Observable<Queue[]> {
    return this.http.get<{ data: Queue[] }>(`${this.apiUrl}/queues`).pipe(map(res => res.data));
  }

  createQueue(data: { name: string; avgServiceTime: number }): Observable<Queue> {
    return this.http.post<{ data: Queue }>(`${this.apiUrl}/queues`, data).pipe(map(res => res.data));
  }

  updateQueue(id: string, data: { name: string; avgServiceTime: number }): Observable<Queue> {
    return this.http.put<{ data: Queue }>(`${this.apiUrl}/queues/${id}`, data).pipe(map(res => res.data));
  }

  deleteQueue(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/queues/${id}`);
  }

  resetQueue(id: string): Observable<Queue> {
    return this.http.patch<{ data: Queue }>(`${this.apiUrl}/queues/${id}/reset`, {}).pipe(map(res => res.data));
  }

  // --- Staff Management ---
  getStaff(): Observable<User[]> {
    return this.http.get<{ data: User[] }>(`${this.apiUrl}/staff`).pipe(map(res => res.data));
  }

  createStaff(data: Partial<User>): Observable<User> {
    return this.http.post<{ data: User }>(`${this.apiUrl}/staff`, data).pipe(map(res => res.data));
  }

  deleteStaff(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/staff/${id}`);
  }

  resetStaffPassword(id: string, data: { password: string }): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.apiUrl}/staff/${id}/reset-password`, data);
  }

  // --- Overview ---
  getOverviewStats(): Observable<DashboardStats> {
    return this.http.get<{ data: DashboardStats }>(`${this.apiUrl}/overview`).pipe(map(res => res.data));
  }
}
