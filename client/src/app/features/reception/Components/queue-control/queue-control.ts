import { Component, OnInit, OnDestroy, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReceptionService } from '../../services/reception.service';
import { SocketService } from '../../../../core/services/socket.service';
import { AuthService } from '../../../auth/services/auth-service';
import { ToastService } from '../../../../shared/services/toast.service';
import { QueueTicketsResponse, QueueStatsResponse } from '../../../../types/queue';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-queue-control',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './queue-control.html',
  styleUrl: './queue-control.css',
})
export class QueueControl implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private receptionService = inject(ReceptionService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  queueId = signal<string>('');
  stats = signal<QueueStatsResponse | null>(null);
  ticketsData = signal<QueueTicketsResponse | null>(null);
  isLoading = signal<boolean>(true);
  isProcessing = signal<boolean>(false);

  get doctorName() {
    return this.stats()?.name?.split('-')[0]?.trim() || '';
  }

  get department() {
    return this.stats()?.name?.split('-')[1]?.trim() || '';
  }

  private subs = new Subscription();

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.queueId.set(id);
      this.loadData();
      this.setupSockets();
    }
  }

  loadData() {
    this.isLoading.set(true);
    
    // Fetch stats
    this.receptionService.getQueueStats(this.queueId()).subscribe({
      next: (stats) => this.stats.set(stats),
      error: (err) => this.toastService.error('Failed to load queue stats')
    });

    // Fetch tickets
    this.fetchTickets();
  }

  fetchTickets() {
    this.receptionService.getTickets(this.queueId()).subscribe({
      next: (data) => {
        this.ticketsData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to load tickets');
        this.isLoading.set(false);
      }
    });
  }

  setupSockets() {
    const user = this.authService.getCurrentUser();
    if (user && user.clinicId) {
      this.socketService.joinClinic(user.clinicId);
      
      this.subs.add(
        this.socketService.onEvent('queueUpdated').subscribe((data: any) => {
          if (data.queueId === this.queueId()) {
            this.stats.update(s => s ? { 
              ...s, 
              waitingCount: data.waitingCount, 
              currentlyServing: data.currentlyServing !== undefined ? data.currentlyServing : s.currentlyServing 
            } : null);
          }
        })
      );

      this.subs.add(
        this.socketService.onEvent('ticketCreated').subscribe((data: any) => {
          if (data.queueId === this.queueId()) {
            this.fetchTickets();
          }
        })
      );

      this.subs.add(
        this.socketService.onEvent('ticketCalled').subscribe((data: any) => {
          if (data.queueId === this.queueId()) this.fetchTickets();
        })
      );

      this.subs.add(
        this.socketService.onEvent('ticketDone').subscribe((data: any) => {
          if (data.queueId === this.queueId()) {
            this.fetchTickets();
            this.receptionService.getQueueStats(this.queueId()).subscribe(s => this.stats.set(s));
          }
        })
      );
    }
  }

  // --- ACTIONS ---

  callNext() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    this.receptionService.callNext(this.queueId()).subscribe({
      next: (ticket) => {
        this.toastService.success(`Called ${ticket.number}`);
        this.fetchTickets();
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.isProcessing.set(false);
      }
    });
  }

  callSpecific(ticketId: string) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    this.receptionService.callSpecific(ticketId, this.queueId()).subscribe({
      next: (ticket) => {
        this.toastService.success(`Called specific ticket ${ticket.number}`);
        this.fetchTickets();
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.isProcessing.set(false);
      }
    });
  }

  markDone() {
    const called = this.ticketsData()?.calledTicket;
    if (!called || this.isProcessing()) return;
    
    this.isProcessing.set(true);
    this.receptionService.markDone(called._id).subscribe({
      next: () => {
        this.toastService.success(`Ticket ${called.number} marked done`);
        this.fetchTickets();
        // Also refresh stats for averages
        this.receptionService.getQueueStats(this.queueId()).subscribe(s => this.stats.set(s));
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.isProcessing.set(false);
      }
    });
  }

  skip() {
    const nextPerson = this.ticketsData()?.nextTicket;
    if (!nextPerson || this.isProcessing()) return;
    
    this.isProcessing.set(true);
    this.receptionService.skipTicket(nextPerson._id, this.queueId()).subscribe({
      next: () => {
        this.toastService.warning(`Ticket ${nextPerson.number} skipped to end of queue`);
        this.fetchTickets();
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.isProcessing.set(false);
      }
    });
  }

  recall() {
    const called = this.ticketsData()?.calledTicket;
    if (!called || this.isProcessing()) return;
    
    this.isProcessing.set(true);
    this.receptionService.recallTicket(called._id).subscribe({
      next: () => {
        this.toastService.info(`Ticket ${called.number} recalled`);
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.isProcessing.set(false);
      }
    });
  }

  // --- KEYBOARD SHORTCUTS ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isLoading() || this.isProcessing()) return;

    // Ignore if user is typing in an input (not currently applicable here, but good practice)
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    switch (event.key.toLowerCase()) {
      case 'n':
        this.callNext();
        break;
      case 'd':
        this.markDone();
        break;
      case 's':
        this.skip();
        break;
      case 'r':
        this.recall();
        break;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
