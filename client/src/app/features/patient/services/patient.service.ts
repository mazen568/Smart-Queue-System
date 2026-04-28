import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Clinic, Queue, Ticket, TicketStatusResponse } from '../../../types/queue';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patient`;

  constructor(private http: HttpClient) {}

  getClinics(): Observable<Clinic[]> {
    return this.http.get<{ data: Clinic[] }>(`${this.apiUrl}/clinics`).pipe(
      map((res) => res.data)
    );
  }

  getClinicDetails(id: string): Observable<{ clinic: Clinic; queues: Queue[] }> {
    return this.http.get<{ data: { clinic: Clinic; queues: Queue[] } }>(`${this.apiUrl}/clinics/${id}`).pipe(
      map((res) => res.data)
    );
  }

  takeTicket(clinicId: string, queueId: string, customerName?: string): Observable<TicketStatusResponse> {
    return this.http.post<{ data: TicketStatusResponse }>(`${this.apiUrl}/tickets`, {
      clinicId,
      queueId,
      customerName,
    }).pipe(map((res) => res.data));
  }

  getTicketStatus(ticketId: string): Observable<TicketStatusResponse> {
    return this.http.get<{ data: TicketStatusResponse }>(`${this.apiUrl}/tickets/${ticketId}`).pipe(
      map((res) => res.data)
    );
  }

  getQueueStats(queueId: string): Observable<Queue> {
    return this.http.get<{ data: Queue }>(`${this.apiUrl}/queues/${queueId}/stats`).pipe(
      map((res) => res.data)
    );
  }
}
