import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';

const AddTicketWidget: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => setDialogOpen(true)}
      >
        Ticket erstellen
      </Button>

      <AddTicketDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  );
};

export default AddTicketWidget; 