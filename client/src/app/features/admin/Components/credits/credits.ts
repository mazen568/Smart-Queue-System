import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHeaderComponent } from '../admin-header/admin-header';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, AdminHeaderComponent],
  templateUrl: './credits.html',
  styleUrl: './credits.css'
})
export class CreditsComponent {}
