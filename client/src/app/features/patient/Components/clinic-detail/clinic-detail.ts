import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { SocketService } from '../../../../core/services/socket.service';
import { Clinic, Queue } from '../../../../types/queue';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../../shared/Components/modal/modal';
import { SpinnerComponent } from '../../../../shared/Components/spinner/spinner';
import { environment } from '../../../../../environments/environment';
import { getClinicLogoUrl } from '../../../../shared/utils/url-utils';

@Component({
  selector: 'app-clinic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent, SpinnerComponent],
  templateUrl: './clinic-detail.html',
  styleUrl: './clinic-detail.css',
})
export class ClinicDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private socketService = inject(SocketService);

  clinic: Clinic | null = null;
  queues: Queue[] = [];
  loading = true;
  private socketSub: Subscription | undefined;

  // Take-ticket dialog state
  dialogOpen = false;
  selectedQueue: Queue | null = null;
  customerName = '';
  booking = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchDetails(id);
      this.socketService.joinClinic(id);
      
      this.socketSub = this.socketService.onEvent('queueUpdated').subscribe((data) => {
        const queueIndex = this.queues.findIndex(q => q._id === data.queueId);
        if (queueIndex !== -1) {
          this.queues[queueIndex] = {
            ...this.queues[queueIndex],
            currentNumber: data.currentNumber ?? this.queues[queueIndex].currentNumber,
            waitingCount: data.waitingCount
          };
          this.cdr.detectChanges();
        }
      });
    } else {
      this.loading = false;
      this.router.navigate(['/patient/clinics']);
    }
  }

  fetchDetails(id: string): void {
    this.loading = true;
    this.patientService.getClinicDetails(id).subscribe({
      next: (data) => {
        this.loading = false;
        this.clinic = data.clinic;
        this.queues = data.queues;
        this.cdr.detectChanges();
        
        const qId = this.route.snapshot.queryParamMap.get('queueId');
        if (qId) {
          const q = this.queues.find((x) => x._id === qId);
          if (q) {
            this.openTakeTicketDialog(q);
            this.router.navigate([], { 
              relativeTo: this.route, 
              queryParams: { queueId: null }, 
              queryParamsHandling: 'merge',
              replaceUrl: true 
            });
          }
        }
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/patient/clinics']);
      }
    });
  }

  openTakeTicketDialog(queue: Queue): void {
    this.selectedQueue = queue;
    this.customerName = '';
    this.dialogOpen = true;
    this.cdr.detectChanges();
  }

  closeDialog(): void {
    if (this.booking) return;
    this.dialogOpen = false;
    this.selectedQueue = null;
    this.cdr.detectChanges();
  }

  confirmTakeTicket(): void {
    if (!this.clinic || !this.selectedQueue) return;
    this.booking = true;
    this.cdr.detectChanges();

    this.patientService
      .takeTicket(this.clinic._id, this.selectedQueue._id, this.customerName?.trim() || undefined)
      .subscribe({
        next: (data: any) => {
          try {
            localStorage.setItem('activeTicketId', data.ticket._id);
          } catch {}
          this.booking = false;
          this.dialogOpen = false;
          this.cdr.detectChanges();
          this.router.navigate(['/patient/ticket', data.ticket._id], { queryParams: { mode: 'confirm' } });
        },
        error: () => {
          this.booking = false;
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    if (this.socketSub) this.socketSub.unsubscribe();
  }

  getLogoUrl(url: string | null | undefined): string | null {
    return getClinicLogoUrl(url, environment.apiUrl, environment.production) || 'assets/default-clinic.jpg';
  }

  onImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = 'assets/default-clinic.jpg';
  img.onerror = null;
}
}


