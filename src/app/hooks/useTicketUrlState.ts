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
 * URL is the single source of truth for all form state
 */
export const useTicketCreationUrlState = () => {
  const [createTicket] = useStringParam('create-ticket');
  const [typeParam, setTypeParam] = useStringParam('type');
  const [equipmentParam, setEquipmentParam] = useStringParam('equipment');
  const [roomParam, setRoomParam] = useStringParam('room');
  const { updateParams } = useUrlBatchUpdate();
  const { machines } = useMachines();

  // Check if create ticket dialog should be open (URL is source of truth)
  const isCreateDialogOpen = createTicket === 'true';

  // Get form data from URL parameters (single source of truth)
  const getFormData = () => {
    // Use explicit type parameter if available, otherwise determine from which parameter exists
    let derivedType: 'verwaltung' | 'betrieb';
    
    if (typeParam === 'verwaltung' || typeParam === 'betrieb') {
      // Explicit type parameter exists
      derivedType = typeParam;
    } else if (roomParam) {
      // Room parameter exists → Verwaltung
      derivedType = 'verwaltung';
    } else if (equipmentParam) {
      // Equipment parameter exists → Betrieb
      derivedType = 'betrieb';
    } else {
      // No parameter → Default to Betrieb
      derivedType = 'betrieb';
    }

    if (derivedType === 'verwaltung') {
      return {
        type: 'verwaltung' as const,
        machine: 'Verwaltung',
        equipmentNummer: '',
        raumnummer: roomParam || ''
      };
    } else {
      // Betrieb type
      const machineData = equipmentParam ? machines.find(m => m.machineNumber === equipmentParam) : null;
      return {
        type: 'betrieb' as const,
        machine: machineData?.name || '',
        equipmentNummer: equipmentParam || '',
        raumnummer: ''
      };
    }
  };

  // Update URL parameters - set type explicitly
  const updateType = (type: 'verwaltung' | 'betrieb') => {
    if (type === 'verwaltung') {
      // Switch to verwaltung → clear equipment, set type
      updateParams({
        'type': 'verwaltung',
        'equipment': null,
        'machine': null
      });
    } else {
      // Switch to betrieb → clear room, set type
      updateParams({
        'type': 'betrieb',
        'room': null,
        'machine': null
      });
    }
  };

  const updateMachine = (machine: string) => {
    // Find equipment number from machine name and store that in URL
    // This automatically makes it betrieb type
    const updates: Record<string, string | null> = {
      'type': 'betrieb', // Set type explicitly
      'room': null,      // Clear room (switches to betrieb)
      'machine': null    // Clear legacy machine param
    };
    
    if (machine) {
      const machineData = machines.find(m => m.name === machine);
      if (machineData) {
        updates.equipment = machineData.machineNumber;
      } else {
        updates.equipment = null;
      }
    } else {
      updates.equipment = null;
    }
    
    updateParams(updates);
  };

  const updateEquipment = (equipment: string) => {
    // Set equipment parameter (automatically makes it betrieb type)
    updateParams({
      'type': 'betrieb',  // Set type explicitly
      'room': null,       // Clear room (switches to betrieb)
      'machine': null,    // Clear legacy machine param
      'equipment': equipment || null
    });
  };

  const updateRoom = (room: string) => {
    // Set room parameter (automatically makes it verwaltung type)
    updateParams({
      'type': 'verwaltung', // Set type explicitly
      'equipment': null,    // Clear equipment (switches to verwaltung)
      'machine': null,      // Clear legacy machine param
      'room': room || null
    });
  };

  // Open create ticket dialog with optional pre-filled data
  const openCreateTicket = (params?: {
    type?: 'verwaltung' | 'betrieb';
    machine?: string;
    equipmentNummer?: string;
    raumnummer?: string;
  }) => {
    const updates: Record<string, string | null> = {
      'create-ticket': 'true',
      // Always clear machine parameter (we don't use it anymore)
      'machine': null
    };
    
    // Set type and corresponding parameter based on what's provided
    if (params?.raumnummer) {
      // Room provided → Verwaltung
      updates.type = 'verwaltung';
      updates.room = params.raumnummer;
      updates.equipment = null;
    } else if (params?.equipmentNummer) {
      // Equipment provided → Betrieb
      updates.type = 'betrieb';
      updates.equipment = params.equipmentNummer;
      updates.room = null;
    } else if (params?.machine) {
      // Machine name provided → Convert to equipment → Betrieb
      const machineData = machines.find(m => m.name === params.machine);
      if (machineData) {
        updates.type = 'betrieb';
        updates.equipment = machineData.machineNumber;
        updates.room = null;
      }
    } else if (params?.type) {
      // Only type provided → Set type, clear other parameters
      updates.type = params.type;
      updates.equipment = null;
      updates.room = null;
    } else {
      // No parameters → Default to betrieb type
      updates.type = 'betrieb';
      updates.equipment = null;
      updates.room = null;
    }
    
    updateParams(updates);
  };

  // Close create ticket dialog and clear all parameters atomically
  const closeCreateTicket = () => {
    updateParams({
      'create-ticket': null,
      'equipment': null,
      'room': null,
      // Clear any legacy parameters
      'machine': null,
      'type': null
    });
  };

  return {
    isCreateDialogOpen,
    getFormData,
    updateType,
    updateMachine,
    updateEquipment,
    updateRoom,
    openCreateTicket,
    closeCreateTicket
  };
}; 