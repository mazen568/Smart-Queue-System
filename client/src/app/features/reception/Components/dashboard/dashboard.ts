import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReceptionService } from '../../services/reception.service';
import { Clinic, Queue, QueueStatsResponse } from '../../../../types/queue';
import { SocketService } from '../../../../core/services/socket.service';
import { AuthService } from '../../../auth/services/auth-service';
import { PatientService } from '../../../patient/services/patient.service';
import { Subscription, forkJoin, switchMap, map, of, catchError } from 'rxjs';

interface QueueView extends Queue {
  currentlyServing?: number | null;
  estimatedWaitTime?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard implements OnInit, OnDestroy {
  private receptionService = inject(ReceptionService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private router = inject(Router);

  clinic = signal<Clinic | null>(null);
  queues = signal<QueueView[]>([]);
  isLoading = signal(true);
  private subs = new Subscription();

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.clinicId) {
      this.socketService.joinClinic(user.clinicId);
      
      // Fetch clinic details to display the name
      this.patientService.getClinicDetails(user.clinicId).subscribe({
        next: (res) => this.clinic.set(res.clinic)
      });
      
      this.subs.add(
        this.socketService.onEvent('queueUpdated').subscribe((data: any) => {
          this.queues.update(qs => qs.map(q => {
            if (q._id === data.queueId) {
              return {
                ...q,
                waitingCount: data.waitingCount,
                currentlyServing: data.currentlyServing !== undefined ? data.currentlyServing : q.currentlyServing,
                avgServiceTime: data.avgServiceTime ?? q.avgServiceTime
              };
            }
            return q;
          }));
        })
      );
    }

    this.loadQueues();
  }

  loadQueues() {
    this.receptionService.getQueues().pipe(
      switchMap(data => {
        if (!data || data.length === 0) {
          return of([]);
        }
        
        // Initialize with basic data before stats load
        this.queues.set(data);
        
        // Fetch detailed stats for all queues concurrently
        const statsReqs = data.map(queue => 
          this.receptionService.getQueueStats(queue._id).pipe(
            map(stats => ({
              ...queue,
              currentlyServing: stats.currentlyServing,
              estimatedWaitTime: stats.estimatedWaitTime
            })),
            catchError(() => of(queue))
          )
        );
        return forkJoin(statsReqs);
      })
    ).subscribe({
      next: (detailedQueues) => {
        if (detailedQueues.length > 0) {
          this.queues.set(detailedQueues);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  openQueue(queue: QueueView) {
    this.router.navigate(['/reception/queue', queue._id]);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
