import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-bar.html',
  styleUrl: './action-bar.css',
})
export class ActionBar {
  @Input() isProcessing: boolean = false;
  @Input() waitingCount: number = 0;
  @Input() hasNextTicket: boolean = false;
  @Input() hasCalledTicket: boolean = false;

  @Output() callNext = new EventEmitter<void>();
  @Output() skip = new EventEmitter<void>();
  @Output() recall = new EventEmitter<void>();
  @Output() markDone = new EventEmitter<void>();
}
