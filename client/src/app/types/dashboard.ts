export interface LiveQueue {
  _id: string;
  name: string;
  currentNumber: number;
  avgServiceTime: number;
  waitingCount: number;
}

export interface TicketActivity {
  _id: string;
  number: number;
  status: 'waiting' | 'called' | 'done' | 'cancelled';
  createdAt?: string;
  completedAt?: string;
  queueName: string;
}

export interface DashboardStats {
  totalPatients: number;
  activeQueues: number;
  avgWaitTime: number;
  ticketsServedToday: number;
  liveQueues: LiveQueue[];
  waitingPatients: TicketActivity[];
  recentServed: TicketActivity[];
}
