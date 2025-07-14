import { useNumberParam } from '@/core/hooks/useUrlState';
import { useTickets } from '@/app/hooks/useTickets';

/**
 * Hook for managing ticket dialog state through URL parameters
 * Uses URL as single source of truth for dialog open/closed state
 */
export const useTicketUrlState = () => {
  const [ticketId, setTicketId] = useNumberParam('ticket');
  const { getTicketById } = useTickets();

  // Get the currently selected ticket from URL
  const selectedTicket = ticketId ? getTicketById(ticketId) : null;

  // Check if dialog should be open
  const isDialogOpen = !!ticketId;

  // Open ticket dialog by setting URL parameter
  const openTicket = (id: number) => {
    setTicketId(id);
  };

  // Close ticket dialog by removing URL parameter
  const closeTicket = () => {
    setTicketId(null);
  };

  return {
    ticketId,
    selectedTicket,
    isDialogOpen,
    openTicket,
    closeTicket
  };
}; 