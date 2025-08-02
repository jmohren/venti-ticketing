import { useNumberParam, useStringParam, useUrlBatchUpdate } from '@/core/hooks/useUrlState';
import { useTickets } from '@/app/hooks/useTickets';
import { useMachines } from '@/app/hooks/useMachines';

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

/**
 * Hook for managing ticket creation dialog state through URL parameters
 * Supports pre-filling room and machine information from URL
 * URL is the single source of truth for dialog state
 */
export const useTicketCreationUrlState = () => {
  const [createTicket] = useStringParam('create-ticket');
  const [roomParam] = useStringParam('room');
  const [machineParam] = useStringParam('machine');
  const { updateParams } = useUrlBatchUpdate();
  const { machines } = useMachines();

  // Check if create ticket dialog should be open (URL is source of truth)
  const isCreateDialogOpen = createTicket === 'true';

  // Find machine from URL parameters (machines are flat, not grouped by rooms)
  const selectedMachine = machineParam ? machines.find(m => m.name === machineParam) : null;
  const selectedRoom = null; // Room concept doesn't exist in current data structure

  // Get initial data for the ticket dialog
  const initialTicketData = selectedMachine ? {
    machine: selectedMachine.name,
    ...(roomParam && { location: roomParam })
  } : (roomParam ? { location: roomParam } : undefined);

  // Open create ticket dialog with optional room/machine pre-selection
  const openCreateTicket = (room?: string, machine?: string) => {
    // Set parameters atomically to avoid race conditions
    const updates: Record<string, string | null> = {
      'create-ticket': 'true'
    };
    
    if (room) updates.room = room;
    if (machine) updates.machine = machine;
    
    // Use batch update to set all parameters at once
    updateParams(updates);
  };

  // Close create ticket dialog and clear all parameters atomically
  const closeCreateTicket = () => {
    // Clear all ticket creation related parameters atomically to avoid race conditions
    updateParams({
      'create-ticket': null,
      'room': null,
      'machine': null
    });
  };

  return {
    isCreateDialogOpen,
    selectedRoom,
    selectedMachine,
    initialTicketData,
    openCreateTicket,
    closeCreateTicket
  };
}; 