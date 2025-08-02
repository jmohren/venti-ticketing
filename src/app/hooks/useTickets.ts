import { useTicketContext } from '@/app/state/TicketProvider';

// Re-export types from the provider for convenience
export type { 
  Ticket, 
  TicketEvent, 
  TicketPriority, 
  TicketStatus, 
  TicketType, 
  TicketCategory 
} from '@/app/state/TicketProvider';

export const useTickets = () => {
  const context = useTicketContext();
  
  return {
    tickets: context.tickets,
    loading: context.loading,
    error: context.error,
    addTicket: context.addTicket,
    updateTicket: context.updateTicket,
    getTicketById: context.getTicketById,
    reorderTickets: context.reorderTickets,
    archiveTickets: context.archiveTickets,
    refreshTickets: context.refreshTickets,
  };
}; 