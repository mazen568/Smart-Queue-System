export interface Clinic {
  _id: string;
  name: string;
  description?: string;
  address?: string;
  logoUrl?: string;
  activeQueuesCount?: number;
}

export interface Queue {
  _id: string;
  clinicId: string;
  name: string;
  currentNumber: number;
  avgServiceTime: number;
  isActive: boolean;
  waitingCount?: number;
  totalServedCount?: number;
}

export interface Ticket {
  _id: string;
  clinicId: string;
  queueId: string | any;
  number: number;
  status: 'waiting' | 'called' | 'done';
  customerName?: string;
  createdAt: string;
}

export interface TicketStatusResponse {
  ticket: Ticket;
  position: number;
  estimatedWaitTime: number;
}

export interface QueueTicketsResponse {
  tickets: Ticket[];
  calledTicket: Ticket | null;
  nextTicket: Ticket | null;
  waitingCount: number;
  totalTickets: number;
}

export interface QueueStatsResponse extends Queue {
  servedToday: number;
  currentlyServing: number | null;
  estimatedWaitTime: number;
}
