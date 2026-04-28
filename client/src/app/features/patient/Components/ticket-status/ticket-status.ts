import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { SocketService } from '../../../../core/services/socket.service';
import { Ticket, Queue } from '../../../../types/queue';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ticket-status',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket-status.html',
  styleUrl: './ticket-status.css',
})
export class TicketStatusComponent implements OnInit, OnDestroy {
  ticket: Ticket | null = null;
  position = 0;
  estimatedWaitTime = 0;
  loading = true;
  private socketSub: Subscription | undefined;

  get queue(): any {
    return this.ticket?.queueId as any;
  }

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('ticketId');
    if (id) {
      this.fetchStatus(id);
    }
  }

  fetchStatus(id: string): void {
    this.patientService.getTicketStatus(id).subscribe({
      next: (data) => {
        this.ticket = data.ticket;
        this.position = data.position;
        this.estimatedWaitTime = data.estimatedWaitTime;
        this.loading = false;

        if (this.ticket?.clinicId) {
          this.socketService.joinClinic(this.ticket.clinicId);
          this.setupSocketListeners();
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setupSocketListeners(): void {
    this.socketSub = this.socketService.onEvent('queueUpdated').subscribe((data) => {
      if (this.ticket && data.queueId === (this.ticket.queueId as any)._id) {
        // Recalculate position based on live stats
        // In a real app, the server would broadcast specialized position updates
        this.refreshPosition();
      }
    });

    this.socketService.onEvent('ticketCalled').subscribe((data) => {
      if (this.ticket && data.ticketId === this.ticket._id) {
        this.ticket.status = 'called';
        this.triggerNotification();
      }
    });
  }

  refreshPosition(): void {
    if (this.ticket) {
      this.patientService.getTicketStatus(this.ticket._id).subscribe((data) => {
        this.position = data.position;
        this.estimatedWaitTime = data.estimatedWaitTime;
        this.ticket = data.ticket;
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

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }
}
