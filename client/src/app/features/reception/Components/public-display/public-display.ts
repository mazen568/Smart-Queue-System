import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceptionService } from '../../services/reception.service';
import { Queue, Clinic } from '../../../../types/queue';
import { SocketService } from '../../../../core/services/socket.service';
import { AuthService } from '../../../auth/services/auth-service';
import { PatientService } from '../../../patient/services/patient.service';
import { Subscription, forkJoin, switchMap, map, of, catchError } from 'rxjs';

interface DisplayQueue extends Queue {
  currentlyServing?: number | null;
  waitingCount?: number;
}

@Component({
  selector: 'app-public-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-display.html',
  styleUrl: './public-display.css',
})
export class PublicDisplay implements OnInit, OnDestroy {
  private receptionService = inject(ReceptionService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);

  clinic = signal<Clinic | null>(null);
  queues = signal<DisplayQueue[]>([]);
  private subs = new Subscription();
  flashQueueId = signal<string | null>(null);
  currentTime = signal<Date>(new Date());
  isConnected = signal<boolean>(true);
  isLoading = signal<boolean>(true);
  audioUnlocked = signal<boolean>(false);
  private timeInterval: any;

  ngOnInit() {
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
    const user = this.authService.getCurrentUser();
    if (user && user.clinicId) {
      this.socketService.joinClinic(user.clinicId);
      
      this.patientService.getClinicDetails(user.clinicId).subscribe({
        next: (res) => {
          this.clinic.set(res.clinic);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
      
      this.subs.add(
        this.socketService.onEvent('connect').subscribe(() => this.isConnected.set(true))
      );
      this.subs.add(
        this.socketService.onEvent('disconnect').subscribe(() => this.isConnected.set(false))
      );

      this.subs.add(
        this.socketService.onEvent('queueUpdated').subscribe((data: any) => {
          this.queues.update(qs => qs.map(q => {
            if (q._id === data.queueId) {
              const oldServing = q.currentlyServing;
              const newServing = data.currentlyServing !== undefined ? data.currentlyServing : q.currentlyServing;
              
              if (newServing && newServing !== oldServing) {
                this.announceTicket(q.name, newServing);
                this.flashCard(q._id);
              }
              
              return { 
                ...q, 
                currentlyServing: newServing,
                waitingCount: data.waitingCount !== undefined ? data.waitingCount : q.waitingCount
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
        if (!data || data.length === 0) return of([]);
        this.queues.set(data);
        const statsReqs = data.map(queue => 
          this.receptionService.getQueueStats(queue._id).pipe(
            map(stats => ({ 
              ...queue, 
              currentlyServing: stats.currentlyServing,
              waitingCount: stats.waitingCount
            })),
            catchError(() => of(queue))
          )
        );
        return forkJoin(statsReqs);
      })
    ).subscribe({
      next: (detailedQueues) => {
        if (detailedQueues.length > 0) this.queues.set(detailedQueues);
      }
    });
  }

  unlockAudio() {
    this.audioUnlocked.set(true);
    if ('speechSynthesis' in window) {
      // Speak a silent utterance to unlock the audio engine
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }
  }

  announceTicket(doctorNameStr: string, ticketNumber: number | string) {
    if (!this.audioUnlocked()) return;
    if ('speechSynthesis' in window) {
      const doctorName = doctorNameStr.split('-')[0].trim();
      const ticketStr = ticketNumber.toString().padStart(3, '0');
      const text = `Ticket A ${ticketStr}, please proceed to ${doctorName}`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  flashCard(queueId: string) {
    this.flashQueueId.set(queueId);
    setTimeout(() => {
      if (this.flashQueueId() === queueId) {
        this.flashQueueId.set(null);
      }
    }, 4000);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    clearInterval(this.timeInterval);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
