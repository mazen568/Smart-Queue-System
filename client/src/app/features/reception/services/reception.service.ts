import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, retry, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Queue, QueueStatsResponse, QueueTicketsResponse, Ticket } from '../../../types/queue';

@Injectable({
  providedIn: 'root',
})
export class ReceptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reception`;

  // --- READ OPERATIONS ---

  getQueues(): Observable<Queue[]> {
    return this.http.get<{ data: Queue[] }>(`${this.apiUrl}/queues`).pipe(
      retry(1),
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  getTickets(queueId: string): Observable<QueueTicketsResponse> {
    return this.http
      .get<{ data: QueueTicketsResponse }>(`${this.apiUrl}/queues/${queueId}/tickets`)
      .pipe(
        map((res) => res.data),
        catchError(this.handleError),
      );
  }

  getQueueStats(queueId: string): Observable<QueueStatsResponse> {
    return this.http
      .get<{ data: QueueStatsResponse }>(`${this.apiUrl}/queues/${queueId}/stats`)
      .pipe(
        map((res) => res.data),
        catchError(this.handleError),
      );
  }

  // --- WRITE OPERATIONS ---

  callNext(queueId: string): Observable<Ticket> {
    return this.http.post<{ data: Ticket }>(`${this.apiUrl}/queues/${queueId}/call-next`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  callSpecific(ticketId: string, queueId: string): Observable<Ticket> {
    return this.http
      .patch<{ data: Ticket }>(`${this.apiUrl}/tickets/${ticketId}/call`, { queueId })
      .pipe(
        map((res) => res.data),
        catchError(this.handleError),
      );
  }

  markDone(ticketId: string): Observable<Ticket> {
    return this.http.patch<{ data: Ticket }>(`${this.apiUrl}/tickets/${ticketId}/done`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  skipTicket(ticketId: string, queueId: string): Observable<Ticket> {
    return this.http
      .patch<{ data: Ticket }>(`${this.apiUrl}/tickets/${ticketId}/skip`, { queueId })
      .pipe(
        map((res) => res.data),
        catchError(this.handleError),
      );
  }

  recallTicket(ticketId: string): Observable<Ticket> {
    return this.http.patch<{ data: Ticket }>(`${this.apiUrl}/tickets/${ticketId}/recall`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  // --- ERROR HANDLING ---

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors (uses the AppError shape from backend: { success: false, message: '...' })
      errorMessage =
        error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
