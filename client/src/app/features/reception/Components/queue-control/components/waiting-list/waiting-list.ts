import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueTicketsResponse } from '../../../../../../types/queue';

@Component({
  selector: 'app-waiting-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiting-list.html',
  styleUrl: './waiting-list.css',
})
export class WaitingList {
  @Input() data: QueueTicketsResponse | null | undefined = null;
  @Output() callSpecific = new EventEmitter<string>();
}
