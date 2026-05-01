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

export interface AuditLog {
  _id: string;
  clinic: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface GlobalSearchResults {
  staff: any[];
  queues: any[];
  patients: any[];
}
