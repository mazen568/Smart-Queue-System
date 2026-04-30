import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-button.html',
  styleUrl: './admin-button.css'
})
export class AdminButtonComponent {
  @Input({ required: true }) label = '';
  @Input() icon = '';
  @Input() loading = false;
  @Output() onClick = new EventEmitter<MouseEvent>();
}

