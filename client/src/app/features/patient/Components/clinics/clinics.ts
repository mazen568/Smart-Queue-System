import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { Clinic } from '../../../../types/queue';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../../shared/Components/spinner/spinner';

@Component({
  selector: 'app-clinics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent],
  templateUrl: './clinics.html',
  styleUrl: './clinics.css',
})
export class ClinicsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private patientService = inject(PatientService);

  private search$ = new BehaviorSubject<string>('');
  clinicsRaw$!: Observable<Clinic[]>;
  clinics$!: Observable<Clinic[]>;
  searchTerm = '';
  activeTicketId: string | null = null;

  ngOnInit(): void {
    // Check for active ticket in session
    try {
      this.activeTicketId = localStorage.getItem('activeTicketId');
      this.cdr.detectChanges();
    } catch {}

    this.clinicsRaw$ = this.patientService.getClinics();
    this.clinics$ = combineLatest([
      this.clinicsRaw$,
      this.search$.pipe(startWith('')),
    ]).pipe(
      map(([clinics, q]) => {
        const query = (q || '').trim().toLowerCase();
        if (!query) return clinics;
        return clinics.filter((c) => {
          const hay = `${c.name || ''} ${c.address || ''}`.toLowerCase();
          return hay.includes(query);
        });
      })
    );
  }

  onSearchChange(value: string): void {
    this.search$.next(value);
  }
}
