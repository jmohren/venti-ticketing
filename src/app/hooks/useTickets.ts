import { useTicketContext } from '@/app/state/TicketProvider';

// Re-export types from the provider for convenience
export type { 
  Ticket, 
  TicketPriority, 
  TicketStatus, 
  TicketEvent 
} from '@/app/state/TicketProvider';

export const useTickets = () => {
  return useTicketContext();
}; 