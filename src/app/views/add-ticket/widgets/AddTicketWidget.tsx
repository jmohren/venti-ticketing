import React, { useRef } from 'react';
import { 
  Button, 
  Box
} from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';
import { useMachines } from '@/app/hooks/useMachines';
import { useTickets } from '@/app/hooks/useTickets';
import { useTicketCreationUrlState } from '@/app/hooks/useTicketUrlState';


const AddTicketWidget: React.FC = () => {
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { machines } = useMachines();
  const { addTicket } = useTickets();
  const { 
    isCreateDialogOpen, 
    openCreateTicket, 
    closeCreateTicket 
  } = useTicketCreationUrlState();

  const handleQrScan = () => {
    // Simply trigger the camera input
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, just open the create ticket dialog
      // In the future, you could process the image to extract QR code data
      console.log('Camera image captured:', file.name);
      
      // Simulate QR code detection by randomly selecting a machine
      if (machines && machines.length > 0) {
        const randomMachineIndex = Math.floor(Math.random() * machines.length);
        const selectedMachine = machines[randomMachineIndex];
        openCreateTicket({ machine: selectedMachine.name });
      } else {
        openCreateTicket();
      }
    }
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleSaveTicket = async (data: {
    machine?: string;
    description?: string;
    priority?: 'rot' | 'gelb' | 'gruen';
    status?: 'backlog' | 'progress' | 'done' | 'archived';
    type?: 'verwaltung' | 'betrieb';
    category?: 'elektrisch' | 'mechanisch';
    responsible?: string;
    plannedCompletion?: string | null;
    images?: string[];
    raumnummer?: string;
    equipmentNummer?: string;
  }) => {
    try {
      const newTicket = {
        machine: data.machine || '',
        description: data.description || '',
        priority: data.priority || 'gruen' as const,
        status: 'backlog' as const,
        type: data.type || 'betrieb' as const,
        category: data.category || 'mechanisch' as const,
        responsible: data.responsible || '',  
        completedAt: null,
        plannedCompletion: data.plannedCompletion || null,
        images: data.images || [],
        raumnummer: data.raumnummer,
        equipmentNummer: data.equipmentNummer,
        events: []
      };

      await addTicket(newTicket);
      closeCreateTicket();
    } catch (error) {
      console.error('Error creating ticket:', error);
      // You could show an error message to the user here
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => openCreateTicket()}
        sx={{ width: 250 }}
      >
        Ticket erstellen
      </Button>

      <Button
        variant="outlined"
        color="primary"
        size="large"
        onClick={handleQrScan}
        startIcon={<QrCodeScanner />}
        sx={{ width: 250 }}
      >
        QR-Code scannen
      </Button>

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use rear camera for QR scanning
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
      />

      {/* Ticket Dialog */}
      <AddTicketDialog 
        open={isCreateDialogOpen} 
        onClose={closeCreateTicket} 
        initialData={undefined}
        onSave={handleSaveTicket}
      />
    </Box>
  );
};

export default AddTicketWidget; 