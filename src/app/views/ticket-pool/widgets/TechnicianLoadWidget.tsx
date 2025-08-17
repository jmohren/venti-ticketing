import React, { useMemo, useState } from 'react';
import { useTickets } from '@/app/hooks/useTickets';
import { useTechnicians } from '@/app/hooks/useTechnicians';
import { useUsers } from '@/core/hooks/useUsers';
import { 
  Box, 
  Typography, 
  useTheme, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Autocomplete, 
  TextField 
} from '@mui/material';
import { Add } from '@mui/icons-material';
import BarChart, { BarChartSeries } from '@/core/ui/BarChart';

type User = ReturnType<typeof useUsers>['users'][number];

const TechnicianLoadWidget: React.FC = () => {
  const { tickets } = useTickets();
  const { technicians, getTechnicianDisplayName, addTechnician, deleteTechnician } = useTechnicians();
  const { users, loading: loadingUsers } = useUsers();
  const theme = useTheme();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Remove confirmation dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [technicianToRemove, setTechnicianToRemove] = useState<string | null>(null);

  // Dialog handlers
  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSelectedUser(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleAddTechnician = async () => {
    if (!selectedUser) return;
    
    try {
      await addTechnician({ userId: selectedUser.userId });
      setSelectedUser(null);
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to add technician:', err);
    }
  };

  const handleRemoveTechnician = (technicianName: string) => {
    setTechnicianToRemove(technicianName);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!technicianToRemove) return;
    
    // Find the technician by display name (labels show display names)
    const technician = technicians.find(tech => 
      getTechnicianDisplayName(tech) === technicianToRemove
    );
    
    if (!technician) {
      console.error('Technician not found:', technicianToRemove);
      setRemoveDialogOpen(false);
      setTechnicianToRemove(null);
      return;
    }

    try {
      await deleteTechnician(technician.id);
      setRemoveDialogOpen(false);
      setTechnicianToRemove(null);
    } catch (error) {
      console.error('Error removing technician:', error);
    }
  };

  const handleCancelRemove = () => {
    setRemoveDialogOpen(false);
    setTechnicianToRemove(null);
  };

  // Helper functions
  const availableUsers = users.filter(user => 
    !technicians.some(tech => tech.userId === user.userId)
  );

  const getUserDisplayName = (user: User) => {
    const { firstName, lastName } = user.profile;
    if (firstName && lastName) {
      return `${firstName} ${lastName} (${user.email})`;
    }
    return user.email;
  };

  const isLoading = loadingUsers;

  const chartData = useMemo(() => {
    // Initialize data for all official technicians (keyed by userId)
    const technicianData: Record<string, { backlog: number; progress: number; displayName: string }> = {};
    
    // Start with all official technicians (with 0 tickets initially)
    technicians.forEach(technician => {
      const displayName = getTechnicianDisplayName(technician);
      technicianData[technician.userId] = { backlog: 0, progress: 0, displayName };
    });
    
    // Aggregate actual ticket data by technician userId
    tickets.forEach(t => {
      if (!t.responsible) return;
      if (!['backlog', 'progress'].includes(t.status)) return;
      
      // Only count tickets assigned to official technicians (by userId)
      if (technicianData[t.responsible]) {
        technicianData[t.responsible][t.status as 'backlog' | 'progress'] += 1;
      }
    });

    // Convert to array and sort by total load (backlog + progress), then by name
    const sortedTechnicians = Object.entries(technicianData)
      .map(([, data]) => ({
        name: data.displayName,
        backlog: data.backlog,
        progress: data.progress,
        total: data.backlog + data.progress
      }))
      .sort((a, b) => {
        // First sort by total load (descending)
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        // Then sort by name (ascending) for consistent ordering when loads are equal
        return a.name.localeCompare(b.name);
      });

    // Transform to BarChart format
    const series: BarChartSeries[] = [
      {
        name: 'Backlog',
        color: theme.palette.primary.dark,
        data: sortedTechnicians.map(tech => ({
          label: tech.name,
          value: tech.backlog
        }))
      },
      {
        name: 'In Bearbeitung',
        color: theme.palette.primary.light,
        data: sortedTechnicians.map(tech => ({
          label: tech.name,
          value: tech.progress
        }))
      }
    ];

    return series;
  }, [tickets, technicians, getTechnicianDisplayName, theme]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header with Wide Add Button and Legend */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        gap: 2
      }}>
        {/* Wide Add Button */}
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleOpenDialog}
          sx={{ 
            flex: 1,
            justifyContent: 'flex-start',
            textTransform: 'none'
          }}
        >
          Techniker hinzufügen
        </Button>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Chip
            label="Backlog"
            size="small"
            sx={{
              backgroundColor: theme.palette.primary.dark,
              color: theme.palette.primary.contrastText,
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
          <Chip
            label="In Bearbeitung"
            size="small"
            sx={{
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
        </Box>
      </Box>

      {technicians.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Keine Service Techniker konfiguriert
          </Typography>
        </Box>
      ) : (
        /* Chart */
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <BarChart 
            series={chartData}
            stacked={true}
            showValues={true}
            onRemoveItem={handleRemoveTechnician}
          />
        </Box>
      )}

      {/* Add Technician Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Techniker hinzufügen</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Autocomplete
            options={availableUsers}
            getOptionLabel={getUserDisplayName}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            loading={isLoading}
            disabled={isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Benutzer auswählen"
                fullWidth
                placeholder="Registrierten Benutzer auswählen..."
                sx={{ '& .MuiInputLabel-root': { paddingTop: '16px' } }}
              />
            )}
            noOptionsText="Keine verfügbaren Benutzer"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleAddTechnician}
            variant="contained"
            disabled={!selectedUser || isLoading}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Technician Confirmation Dialog */}
      <Dialog 
        open={removeDialogOpen} 
        onClose={handleCancelRemove}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Techniker entfernen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie <strong>{technicianToRemove}</strong> als Techniker entfernen möchten?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirmRemove}
            variant="contained"
            color="error"
          >
            Entfernen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TechnicianLoadWidget; 