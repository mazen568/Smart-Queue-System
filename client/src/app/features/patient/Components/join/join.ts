import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './join.html',
  styleUrls: ['./join.css'],
})
export class JoinComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const clinicId = this.route.snapshot.queryParamMap.get('clinicId');
    const queueId = this.route.snapshot.queryParamMap.get('queueId');

    if (!clinicId) {
      this.router.navigate(['/patient/clinics']);
      return;
    }

    // Route into the patient flow. If queueId is present, clinic screen will prompt to take a ticket for it.
    this.router.navigate(['/patient/clinic', clinicId], {
      queryParams: queueId ? { queueId } : undefined,
      replaceUrl: true,
    });
  }
}

