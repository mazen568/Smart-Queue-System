import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, retry, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Clinic, Queue, Ticket, TicketStatusResponse } from '../../../types/queue';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/patient`;

  getClinics(): Observable<Clinic[]> {
    return this.http.get<{ data: Clinic[] }>(`${this.apiUrl}/clinics`).pipe(
      retry(1),
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  getClinicDetails(id: string): Observable<{ clinic: Clinic; queues: Queue[] }> {
    return this.http.get<{ data: { clinic: Clinic; queues: Queue[] } }>(`${this.apiUrl}/clinics/${id}`).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  takeTicket(clinicId: string, queueId: string, customerName?: string): Observable<TicketStatusResponse> {
    return this.http.post<{ data: TicketStatusResponse }>(`${this.apiUrl}/tickets`, {
      clinicId,
      queueId,
      customerName,
    }).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  getTicketStatus(ticketId: string): Observable<TicketStatusResponse> {
    return this.http.get<{ data: TicketStatusResponse }>(`${this.apiUrl}/tickets/${ticketId}`).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  getQueueStats(queueId: string): Observable<Queue> {
    return this.http.get<{ data: Queue }>(`${this.apiUrl}/queues/${queueId}/stats`).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  cancelTicket(ticketId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tickets/${ticketId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors: include status code explicitly for component handling
      errorMessage = `STATUS_${error.status}: ${error.error?.message || error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

}
