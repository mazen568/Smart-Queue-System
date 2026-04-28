import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { SocketService } from '../../../../core/services/socket.service';
import { Ticket, Queue } from '../../../../types/queue';
import { Subscription } from 'rxjs';
import { QrCodeComponent } from '../qr-code/qr-code';
import { SpinnerComponent } from '../../../../shared/Components/spinner/spinner';
import { ModalComponent } from '../../../../shared/Components/modal/modal';

@Component({
  selector: 'app-ticket-status',
  standalone: true,
  imports: [CommonModule, RouterModule, QrCodeComponent, SpinnerComponent, ModalComponent],
  templateUrl: './ticket-status.html',
  styleUrl: './ticket-status.css',
})
export class TicketStatusComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private socketService = inject(SocketService);

  ticket: Ticket | null = null;
  position = 0;
  estimatedWaitTime = 0;
  loading = true;
  private socketSub: Subscription | undefined;
  mode: 'confirm' | 'track' = 'track';

  cancelDialogOpen = false;
  isCancelling = false;

  get queue(): any {
    return this.ticket?.queueId as any;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('ticketId');
    
    // Reactive mode switching (handles 'Track my ticket' button click)
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'] === 'confirm' ? 'confirm' : 'track';
      this.cdr.detectChanges();
    });
    
    if (id) {
      this.fetchStatus(id);
    }
  }

  fetchStatus(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.patientService.getTicketStatus(id).subscribe({
      next: (data) => {
        this.ticket = data.ticket;
        this.position = data.position;
        this.estimatedWaitTime = data.estimatedWaitTime;
        this.loading = false;
        this.cdr.detectChanges();

        if (this.ticket?.clinicId) {
          this.socketService.joinClinic(this.ticket.clinicId);
          this.setupSocketListeners();
        }

        if (this.mode === 'confirm') {
          this.requestNotifications();
          try {
            localStorage.setItem('activeTicketId', this.ticket._id);
          } catch {}
        }
      },
      error: (err) => {
        console.error('Ticket fetch error:', err);
        this.loading = false;
        this.cdr.detectChanges();
        try {
          localStorage.removeItem('activeTicketId');
        } catch {}
        this.router.navigate(['/patient/clinics']);
      }
    });
  }

  setupSocketListeners(): void {
    if (this.socketSub) this.socketSub.unsubscribe();
    const sub = new Subscription();

    sub.add(this.socketService.onEvent('queueUpdated').subscribe((data) => {
      if (this.ticket && data.queueId === (this.ticket.queueId as any)._id) {
        this.refreshPosition();
      }
    }));

    sub.add(this.socketService.onEvent('ticketCalled').subscribe((data) => {
      if (this.ticket && data.ticketId === this.ticket._id) {
        this.ticket.status = 'called';
        this.triggerNotification();
        this.cdr.detectChanges();
      }
    }));

    sub.add(this.socketService.onEvent('ticketDone').subscribe((data) => {
      if (this.ticket && data.ticketId === this.ticket._id) {
        this.ticket.status = 'done';
        try {
          localStorage.removeItem('activeTicketId');
        } catch {}
        this.cdr.detectChanges();
      }
    }));

    this.socketSub = sub;
  }

  refreshPosition(): void {
    if (this.ticket) {
      this.patientService.getTicketStatus(this.ticket._id).subscribe((data) => {
        this.position = data.position;
        this.estimatedWaitTime = data.estimatedWaitTime;
        this.ticket = data.ticket;
        this.cdr.detectChanges();
      });
    }
  }

  triggerNotification(): void {
    if (Notification.permission === 'granted') {
      new Notification('Your Turn!', {
        body: 'The doctor is ready to see you. Please proceed to the counter.',
        icon: '/assets/icons/icon-72x72.png'
      });
    } else {
      alert('IT IS YOUR TURN! Please proceed.');
    }
  }

  requestNotifications(): void {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  confirmLeave(): void {
    if (!this.ticket || this.isCancelling) return;
    
    this.isCancelling = true;
    this.cdr.detectChanges();

    this.patientService.cancelTicket(this.ticket._id).subscribe({
      next: () => {
        try {
          localStorage.removeItem('activeTicketId');
        } catch {}
        this.isCancelling = false;
        this.cancelDialogOpen = false;
        this.cdr.detectChanges();
        this.router.navigate(['/patient/clinics']);
      },
      error: () => {
        this.isCancelling = false;
        this.cdr.detectChanges();
      }
    });
  }

  get ticketUrl(): string {
    if (!this.ticket) return '';
    return `${window.location.origin}/patient/ticket/${this.ticket._id}`;
  }

  ngOnDestroy(): void {
    if (this.socketSub) this.socketSub.unsubscribe();
  }
}
