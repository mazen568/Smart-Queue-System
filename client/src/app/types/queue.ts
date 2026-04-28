export interface Clinic {
  _id: string;
  name: string;
  description?: string;
  address?: string;
  logoUrl?: string;
}

export interface Queue {
  _id: string;
  clinicId: string;
  name: string;
  currentNumber: number;
  avgServiceTime: number;
  isActive: boolean;
  waitingCount?: number;
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
