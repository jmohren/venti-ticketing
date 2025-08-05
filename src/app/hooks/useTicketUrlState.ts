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
  const [typeParam] = useStringParam('type');
  const [equipmentParam] = useStringParam('equipment');
  const [roomParam] = useStringParam('room');
  const [machineParam] = useStringParam('machine');
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
    } else if (equipmentParam || machineParam) {
      // Equipment or machine parameter exists → Betrieb
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
      // Betrieb type - prioritize machine parameter, fall back to deriving from equipment
      let machineName = machineParam || '';
      if (!machineName && equipmentParam) {
        // Try to derive machine name from equipment number
        const machineData = machines.find(m => m.machineNumber === equipmentParam);
        machineName = machineData?.name || '';
      }
      
      return {
        type: 'betrieb' as const,
        machine: machineName,
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
    // Store machine name in URL parameter for free text support
    // This automatically makes it betrieb type
    const updates: Record<string, string | null> = {
      'type': 'betrieb', // Set type explicitly
      'room': null,      // Clear room (switches to betrieb)
      'machine': machine || null // Store the machine name directly
    };
    
    // If machine exists in our list, also set equipment number
    if (machine) {
      const machineData = machines.find(m => m.name === machine);
      if (machineData) {
        updates.equipment = machineData.machineNumber;
      }
      // Don't clear equipment if machine not found - allow free text
    } else {
      updates.equipment = null;
    }
    
    updateParams(updates);
  };

  const updateEquipment = (equipment: string) => {
    // Set equipment parameter (automatically makes it betrieb type)
    const updates: Record<string, string | null> = {
      'type': 'betrieb',  // Set type explicitly
      'room': null,       // Clear room (switches to betrieb)
      'equipment': equipment || null
    };
    
    // If equipment exists in our list, also set machine name
    if (equipment) {
      const machineData = machines.find(m => m.machineNumber === equipment);
      if (machineData) {
        updates.machine = machineData.name;
      }
      // Don't clear machine if equipment not found - allow free text
    } else {
      updates.machine = null;
    }
    
    updateParams(updates);
  };

  // Update only equipment field without affecting machine (for typing)
  const updateEquipmentOnly = (equipment: string) => {
    updateParams({
      'type': 'betrieb',  // Set type explicitly
      'room': null,       // Clear room (switches to betrieb)
      'equipment': equipment || null
      // Don't update machine parameter
    });
  };

  // Update only machine field without affecting equipment (for typing)
  const updateMachineOnly = (machine: string) => {
    updateParams({
      'type': 'betrieb', // Set type explicitly
      'room': null,      // Clear room (switches to betrieb)
      'machine': machine || null
      // Don't update equipment parameter
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
      'create-ticket': 'true'
    };
    
    // Set type and corresponding parameter based on what's provided
    if (params?.raumnummer) {
      // Room provided → Verwaltung
      updates.type = 'verwaltung';
      updates.room = params.raumnummer;
      updates.equipment = null;
      updates.machine = null;
    } else if (params?.equipmentNummer) {
      // Equipment provided → Betrieb
      updates.type = 'betrieb';
      updates.equipment = params.equipmentNummer;
      updates.room = null;
      // Try to find matching machine name
      const machineData = machines.find(m => m.machineNumber === params.equipmentNummer);
      updates.machine = machineData?.name || null;
    } else if (params?.machine) {
      // Machine name provided → Store machine name and try to find equipment
      updates.type = 'betrieb';
      updates.machine = params.machine;
      updates.room = null;
      // Try to find matching equipment number
      const machineData = machines.find(m => m.name === params.machine);
      updates.equipment = machineData?.machineNumber || null;
    } else if (params?.type) {
      // Only type provided → Set type, clear other parameters
      updates.type = params.type;
      updates.equipment = null;
      updates.room = null;
      updates.machine = null;
    } else {
      // No parameters → Default to betrieb type
      updates.type = 'betrieb';
      updates.equipment = null;
      updates.room = null;
      updates.machine = null;
    }
    
    updateParams(updates);
  };

  // Close create ticket dialog and clear all parameters atomically
  const closeCreateTicket = () => {
    updateParams({
      'create-ticket': null,
      'equipment': null,
      'room': null,
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
    updateMachineOnly,
    updateEquipmentOnly,
    updateRoom,
    openCreateTicket,
    closeCreateTicket
  };
}; 