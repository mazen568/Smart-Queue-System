import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { SocketService } from '../../../../core/services/socket.service';
import { Clinic, Queue } from '../../../../types/queue';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-clinic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clinic-detail.html',
  styleUrl: './clinic-detail.css',
})
export class ClinicDetailComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  queues: Queue[] = [];
  loading = true;
  private socketSub: Subscription | undefined;

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
          this.queues[queueIndex].currentNumber = data.newNumber;
          this.queues[queueIndex].waitingCount = data.waitingCount;
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

  takeTicket(queueId: string): void {
    if (!this.clinic) return;
    
    const customerName = prompt('Please enter your name (Optional):') || 'Guest';
    
    this.patientService.takeTicket(this.clinic._id, queueId, customerName).subscribe((data) => {
      this.router.navigate(['/patient/ticket', data.ticket._id]);
    });
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }
}
