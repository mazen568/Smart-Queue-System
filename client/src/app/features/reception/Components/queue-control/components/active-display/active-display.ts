import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueStatsResponse, Ticket } from '../../../../../../types/queue';

@Component({
  selector: 'app-active-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-display.html',
  styleUrl: './active-display.css',
})
export class ActiveDisplay {
  @Input() calledTicket: Ticket | null | undefined = null;
  @Input() stats: QueueStatsResponse | null = null;
}
