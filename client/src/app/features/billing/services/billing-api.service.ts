import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {environment} from '../../../../environments/environment';

export interface Credit {
  clinicId: string;
  balance: number;
  updatedAt: Date;
}

export interface Payment {
  _id: string;
  clinicId: string;
  amount: number;
  credits: number;
  method: 'stripe';
  status: 'pending' | 'completed' | 'failed';
  stripeSessionId?: string;
  createdAt: Date;
}

export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Credits
  getBalance(): Observable<Credit> {
    return this.http.get<{ data: Credit }>(`${this.apiUrl}/credits`).pipe(
      map(res => res.data)
    );
  }

  // Payments
  getPaymentHistory(page: number = 1, limit: number = 10): Observable<{ data: Payment[], total: number, page: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{ data: Payment[], pagination: { total: number; page: number; pages: number } }>(
      `${this.apiUrl}/payments`,
      { params }
    ).pipe(map(res => ({
      data: res.data,
      total: res.pagination.total,
      page: res.pagination.page,
    })));
  }

  // Stripe Checkout
  createStripeCheckout(credits: 50 | 100 | 200): Observable<CheckoutSession> {
    return this.http.post<{ data: CheckoutSession }>(
      `${this.apiUrl}/payments/stripe/checkout`,
      { credits }
    ).pipe(map(res => res.data));
  }
}
