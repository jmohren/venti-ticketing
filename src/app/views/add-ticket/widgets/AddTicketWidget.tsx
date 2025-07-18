import React, { useState } from 'react';
import { 
  Button, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography,
  CircularProgress
} from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';
import { useMachines } from '@/app/hooks/useMachines';
import { useTicketCreationUrlState } from '@/app/hooks/useTicketUrlState';
import { useTickets, Ticket } from '@/app/hooks/useTickets';
import { useAuth } from '@/core/hooks/useAuth';

const AddTicketWidget: React.FC = () => {
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { rooms } = useMachines();
  const { addTicket } = useTickets();
  const { getCurrentUser } = useAuth();
  const { 
    isCreateDialogOpen, 
    initialTicketData, 
    openCreateTicket, 
    closeCreateTicket 
  } = useTicketCreationUrlState();

  const handleQrScan = () => {
    setQrScanOpen(true);
  };

  const handleStartScan = () => {
    setIsScanning(true);
    
    // Simulate QR code scanning delay
    setTimeout(() => {
      // Simulate scanning a QR code that contains room and machine info
      // Randomly select from available rooms and machines
      if (rooms && rooms.length > 0) {
        const randomRoomIndex = Math.floor(Math.random() * rooms.length);
        const selectedRoom = rooms[randomRoomIndex];
        
        if (selectedRoom.machines && selectedRoom.machines.length > 0) {
          const randomMachineIndex = Math.floor(Math.random() * selectedRoom.machines.length);
          const selectedMachine = selectedRoom.machines[randomMachineIndex];
          
          setIsScanning(false);
          setQrScanOpen(false);
          
          // Open the create ticket dialog with pre-selected room and machine
          openCreateTicket(selectedRoom.name, selectedMachine.name);
        }
      }
    }, 2000); // 2 second scanning simulation
  };

  const handleQrScanCancel = () => {
    setQrScanOpen(false);
    setIsScanning(false);
  };

  const handleSaveTicket = (data: {
    machine?: string;
    description?: string;
    priority?: 'rot' | 'gelb' | 'gruen';
    location?: string;
    status?: 'backlog' | 'progress' | 'done';
    responsible?: string;
    plannedCompletion?: string | null;
    images?: string[];
  }) => {
    // Generate a unique ID for the new ticket
    const newId = Date.now();
    
    // Create the new ticket with all required fields
    const newTicket: Ticket = {
      id: newId,
      machine: data.machine || '',
      description: data.description || '',
      priority: data.priority || 'gruen',
      status: 'backlog', // New tickets always start as backlog
      location: data.location || '', // Store the room/location information
      responsible: '', // New tickets are unassigned initially
      completedAt: null,
      plannedCompletion: null, // No planned completion during creation
      images: data.images || [], // Save any uploaded images
      events: [
        {
          timestamp: new Date().toISOString(),
          type: 'create',
          details: `Ticket erstellt von ${getCurrentUser()?.email || 'Benutzer'}`
        }
      ]
    };

    // Add the ticket to the provider state
    addTicket(newTicket);
    
    // Close the dialog (URL state will be cleared)
    closeCreateTicket();
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

      {/* QR Code Scanner Dialog */}
      <Dialog open={qrScanOpen} onClose={handleQrScanCancel} maxWidth="sm" fullWidth>
        <DialogTitle>QR-Code Scanner</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Richte die Kamera auf den QR-Code der Maschine
            </Typography>
            
            {/* Camera view */}
            <Box 
              sx={{ 
                height: 300, 
                backgroundColor: 'grey.100', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 1,
                border: '2px solid',
                borderColor: 'grey.300',
                position: 'relative'
              }}
            >
              {isScanning ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={40} sx={{ color: 'primary.main' }} />
                  <Typography variant="body2" color="primary.main">
                    Verarbeiten...
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {/* Fake QR Code */}
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      backgroundColor: 'white',
                      border: '2px solid black',
                      borderRadius: 1,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gridTemplateRows: 'repeat(8, 1fr)',
                      gap: 0.5,
                      padding: 1,
                      '& > div': {
                        backgroundColor: 'black',
                        borderRadius: 0.5,
                      }
                    }}
                  >
                    {/* QR code pattern */}
                    <div style={{ gridColumn: '1/3', gridRow: '1/3' }} />
                    <div style={{ gridColumn: '7/9', gridRow: '1/3' }} />
                    <div style={{ gridColumn: '1/3', gridRow: '7/9' }} />
                    <div style={{ gridColumn: '3/4', gridRow: '3/4' }} />
                    <div style={{ gridColumn: '5/6', gridRow: '3/4' }} />
                    <div style={{ gridColumn: '4/5', gridRow: '4/5' }} />
                    <div style={{ gridColumn: '6/7', gridRow: '4/5' }} />
                    <div style={{ gridColumn: '3/4', gridRow: '5/6' }} />
                    <div style={{ gridColumn: '5/6', gridRow: '5/6' }} />
                    <div style={{ gridColumn: '7/8', gridRow: '5/6' }} />
                    <div style={{ gridColumn: '4/5', gridRow: '6/7' }} />
                    <div style={{ gridColumn: '6/7', gridRow: '6/7' }} />
                    <div style={{ gridColumn: '8/9', gridRow: '6/7' }} />
                    <div style={{ gridColumn: '5/6', gridRow: '7/8' }} />
                    <div style={{ gridColumn: '7/8', gridRow: '7/8' }} />
                    <div style={{ gridColumn: '6/7', gridRow: '8/9' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    QR-Code erkannt
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQrScanCancel} color="inherit" disabled={isScanning}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleStartScan} 
            variant="contained" 
            disabled={isScanning}
          >
            {isScanning ? 'Scannen...' : 'Scannen starten'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Dialog */}
      <AddTicketDialog 
        open={isCreateDialogOpen} 
        onClose={closeCreateTicket} 
        initialData={initialTicketData}
        onSave={handleSaveTicket}
      />
    </Box>
  );
};

export default AddTicketWidget; 