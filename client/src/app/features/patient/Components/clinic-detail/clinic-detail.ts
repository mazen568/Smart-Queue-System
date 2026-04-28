import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { SocketService } from '../../../../core/services/socket.service';
import { Clinic, Queue } from '../../../../types/queue';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-clinic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './clinic-detail.html',
  styleUrl: './clinic-detail.css',
})
export class ClinicDetailComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  queues: Queue[] = [];
  loading = true;
  private socketSub: Subscription | undefined;
  private qpSub: Subscription | undefined;

  // Take-ticket dialog state
  dialogOpen = false;
  selectedQueue: Queue | null = null;
  customerName = '';
  booking = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchDetails(id);
      this.socketService.joinClinic(id);
      
      // Listen for ticket updates to refresh stats
      this.socketSub = this.socketService.onEvent('queueUpdated').subscribe((data) => {
        const queueIndex = this.queues.findIndex(q => q._id === data.queueId);
        if (queueIndex !== -1) {
          this.queues[queueIndex].currentNumber = data.currentNumber ?? this.queues[queueIndex].currentNumber;
          this.queues[queueIndex].waitingCount = data.waitingCount;
        }
      });

      // If navigated from a QR join link, prompt immediately for the selected queue
      this.qpSub = this.route.queryParamMap.subscribe((qp) => {
        const queueId = qp.get('queueId');
        if (!queueId) return;
        const q = this.queues.find((x) => x._id === queueId);
        if (q) {
          this.openTakeTicketDialog(q);
          // Clear query param after we used it
          this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
        }
      });
    }
  }

  fetchDetails(id: string): void {
    this.patientService.getClinicDetails(id).subscribe({
      next: (data) => {
        this.clinic = data.clinic;
        this.queues = data.queues;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/patient/clinics']);
      }
    });
  }

  openTakeTicketDialog(queue: Queue): void {
    this.selectedQueue = queue;
    this.customerName = '';
    this.dialogOpen = true;
  }

  closeDialog(): void {
    if (this.booking) return;
    this.dialogOpen = false;
    this.selectedQueue = null;
  }

  confirmTakeTicket(): void {
    if (!this.clinic || !this.selectedQueue) return;
    this.booking = true;

    this.patientService
      .takeTicket(this.clinic._id, this.selectedQueue._id, this.customerName?.trim() || undefined)
      .subscribe({
        next: (data: any) => {
          // Persist one active ticket per session
          try {
            localStorage.setItem('activeTicketId', data.ticket._id);
          } catch {}

          this.booking = false;
          this.dialogOpen = false;
          this.router.navigate(['/patient/ticket', data.ticket._id], { queryParams: { mode: 'confirm' } });
        },
        error: () => {
          this.booking = false;
        },
      });
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    if (this.qpSub) {
      this.qpSub.unsubscribe();
    }
  }
}
