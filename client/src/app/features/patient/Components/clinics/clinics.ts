import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { Clinic } from '../../../../types/queue';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-clinics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clinics.html',
  styleUrl: './clinics.css',
})
export class ClinicsComponent implements OnInit {
  clinics$: Observable<Clinic[]> | undefined;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.clinics$ = this.patientService.getClinics();
  }
}
