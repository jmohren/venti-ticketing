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
import { useTickets } from '@/app/hooks/useTickets';
import { useAuth } from '@/core/hooks/useAuth';

const AddTicketWidget: React.FC = () => {
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { machines } = useMachines();
  const { addTicket } = useTickets();
  const { getCurrentUser } = useAuth();
  const { 
    isCreateDialogOpen, 
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
      // Simulate scanning a QR code that contains machine info
      // Randomly select from available machines
      if (machines && machines.length > 0) {
        const randomMachineIndex = Math.floor(Math.random() * machines.length);
        const selectedMachine = machines[randomMachineIndex];
        
        setIsScanning(false);
        setQrScanOpen(false);
        
        // Open the create ticket dialog with pre-selected machine
        openCreateTicket({ machine: selectedMachine.name });
      }
    }, 2000); // 2 second scanning simulation
  };

  const handleQrScanCancel = () => {
    setQrScanOpen(false);
    setIsScanning(false);
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
      // Create the new ticket with all required fields (no ID needed)
      const newTicket = {
        machine: data.machine || '',
        description: data.description || '',
        priority: data.priority || 'gruen' as const,
        status: 'backlog' as const, // New tickets always start as backlog
        type: data.type || 'betrieb' as const, // Default to betrieb
        category: data.category || 'mechanisch' as const, // Default to mechanisch
        responsible: '', // New tickets are unassigned initially
        completedAt: null,
        plannedCompletion: null, // No planned completion during creation
        images: data.images || [], // Save any uploaded images
        raumnummer: data.raumnummer,
        equipmentNummer: data.equipmentNummer,
        events: [] // Events will be added by addTicket
      };

      // Add the ticket to the provider state (now async)
      await addTicket(newTicket);
      
      // Close the dialog (URL state will be cleared)
      closeCreateTicket();
    } catch (error) {
      console.error('Failed to save ticket:', error);
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
        initialData={undefined}
        onSave={handleSaveTicket}
      />
    </Box>
  );
};

export default AddTicketWidget; 