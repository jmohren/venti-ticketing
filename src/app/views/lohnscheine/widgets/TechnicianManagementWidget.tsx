import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { useTechnicians } from '@/app/hooks/useTechnicians';
import { useTickets } from '@/app/hooks/useTickets';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { appConfig } from '@/config/appConfig';

interface User {
  userId: string;
  email: string;
  profile: {
    firstName: string | null;
    lastName: string | null;
    isComplete: boolean;
  };
}

interface UsersResponse {
  users: User[];
  nextPaginationToken: string | null;
}

interface TechnicianStats {
  id: number;
  name: string;
  email: string;
  assigned: number;
  completed: number;
  totalWorkTimeMinutes: number;
}

const TechnicianManagementWidget: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Use the shared technician provider
  const { 
    technicians, 
    loading: technicianLoading, 
    error: technicianError, 
    addTechnician, 
    deleteTechnician,
    getTechnicianDisplayName,
  } = useTechnicians();
  
  // Use tickets for performance analysis
  const { tickets } = useTickets();

  // Selected month for performance stats
  const currentMonth = useMemo(() => {
    return {
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth),
      name: format(selectedMonth, 'MMMM yyyy')
    };
  }, [selectedMonth]);

  // Calculate performance stats
  const technicianStats = useMemo(() => {
    const stats: TechnicianStats[] = technicians.map(technician => {
      const displayName = getTechnicianDisplayName(technician);
      
      // Get tickets assigned to this technician in current month
      const technicianTickets = tickets.filter(ticket => 
        ticket.responsible === displayName
      );

      // Count assigned tickets in current month (by creation date)
      const assigned = technicianTickets.filter(ticket => {
        if (!ticket.created_at) return false;
        const createdDate = new Date(ticket.created_at);
        return isWithinInterval(createdDate, currentMonth);
      }).length;

      // Count completed tickets in current month (by completion date)
      const completed = technicianTickets.filter(ticket => {
        if (!ticket.completedAt) return false;
        const completedDate = new Date(ticket.completedAt);
        return isWithinInterval(completedDate, currentMonth);
      }).length;

      // Calculate total work time in minutes from work events
      let totalWorkTimeMinutes = 0;
      
      technicianTickets.forEach(ticket => {
        const workEvents = ticket.events
          .filter(event => 
            (event.type === 'work_started' || event.type === 'work_paused') &&
            event.details?.startsWith(displayName) &&
            isWithinInterval(new Date(event.timestamp), currentMonth)
          )
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let currentWorkStart: Date | null = null;
        
        workEvents.forEach(event => {
          if (event.type === 'work_started') {
            currentWorkStart = new Date(event.timestamp);
          } else if (event.type === 'work_paused' && currentWorkStart) {
            const workEnd = new Date(event.timestamp);
            const workDurationMinutes = Math.round((workEnd.getTime() - currentWorkStart.getTime()) / (1000 * 60));
            totalWorkTimeMinutes += workDurationMinutes;
            currentWorkStart = null;
          }
        });
      });

      return {
        id: technician.id,
        name: displayName,
        email: technician.email,
        assigned,
        completed,
        totalWorkTimeMinutes
      };
    });

    return stats.sort((a, b) => {
      // Sort by completed tickets (desc), then by work time (desc)
      if (b.completed !== a.completed) {
        return b.completed - a.completed;
      }
      return b.totalWorkTimeMinutes - a.totalWorkTimeMinutes;
    });
  }, [technicians, tickets, getTechnicianDisplayName, currentMonth]);

  // Format work time helper
  const formatWorkTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Load registered users from the API
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError(null);
      
      // Use the users endpoint with proper backend URL
      const response = await fetch(`${appConfig.api.baseUrl}/users/?limit=100`, {
        credentials: 'include',
        headers: {
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: UsersResponse = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUserError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Add a new technician
  const handleAddTechnician = async () => {
    if (!selectedUser) return;
    
    try {
      const newTechnician = {
        userId: selectedUser.userId,
        firstName: selectedUser.profile.firstName,
        lastName: selectedUser.profile.lastName,
        email: selectedUser.email
      };
      
      await addTechnician(newTechnician);
      setSelectedUser(null);
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to add technician:', err);
    }
  };

  // Open add dialog
  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSelectedUser(null);
  };

  // Close add dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Open month picker
  const handleOpenMonthPicker = () => {
    setMonthPickerOpen(true);
  };

  // Close month picker
  const handleCloseMonthPicker = () => {
    setMonthPickerOpen(false);
  };

  // Handle month selection
  const handleMonthSelect = (date: Date) => {
    setSelectedMonth(date);
    setMonthPickerOpen(false);
  };

  // Generate available months (current month + endless past months)
  const availableMonths = useMemo(() => {
    const months: Date[] = [];
    const today = new Date();
    
    // Add current month and last 120 months (10 years) for comprehensive history
    for (let i = 0; i <= 120; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(date);
    }
    
    return months;
  }, []);

  // Remove a technician
  const handleRemoveTechnician = async (technicianId: number) => {
    try {
      await deleteTechnician(technicianId);
    } catch (err) {
      console.error('Failed to remove technician:', err);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter out users who are already technicians
  const availableUsers = users.filter(user => 
    !technicians.some(tech => tech.userId === user.userId)
  );

  // Get display name for user
  const getUserDisplayName = (user: User) => {
    const { firstName, lastName } = user.profile;
    if (firstName && lastName) {
      return `${firstName} ${lastName} (${user.email})`;
    }
    return user.email;
  };

  // Combined loading and error states
  const isLoading = loadingUsers || technicianLoading;
  const error = userError || technicianError;

  return (
    <>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Combined Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          backgroundColor: 'grey.100'
        }}>
          <Typography variant="h6">
            Technicians
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={currentMonth.name} 
              size="small" 
              color="primary" 
              variant="outlined"
              onClick={handleOpenMonthPicker}
              sx={{ cursor: 'pointer' }}
            />
            <Fab 
              size="small" 
              color="primary" 
              onClick={handleOpenDialog}
              sx={{ width: 40, height: 40 }}
            >
              <Add />
            </Fab>
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ px: 2, pb: 1 }}>
            {error}
          </Typography>
        )}

        {/* Unified Table */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {technicians.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Keine Service Techniker konfiguriert
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Techniker
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Zugewiesen
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Erledigt
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Arbeitszeit
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: 60 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Aktionen
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {technicianStats.map((stat) => (
                    <TableRow key={stat.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {stat.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {stat.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={stat.assigned} 
                          size="small" 
                          color={stat.assigned > 0 ? "primary" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={stat.completed} 
                          size="small" 
                          color={stat.completed > 0 ? "success" : "default"}
                          variant={stat.completed > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={stat.totalWorkTimeMinutes > 0 ? "text.primary" : "text.secondary"}
                        >
                          {stat.totalWorkTimeMinutes > 0 ? formatWorkTime(stat.totalWorkTimeMinutes) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveTechnician(stat.id)}
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Add Technician Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Technician</DialogTitle>
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
                label="Select User"
                fullWidth
                placeholder="Choose a registered user..."
                sx={{ '& .MuiInputLabel-root': { paddingTop: '16px' } }}
              />
            )}
            noOptionsText="No available users"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddTechnician}
            variant="contained"
            disabled={!selectedUser || isLoading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Month Picker Dialog */}
      <Dialog 
        open={monthPickerOpen} 
        onClose={handleCloseMonthPicker}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Select Month
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Choose a month to view performance data
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {/* Group months by year for better organization */}
          <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
            {Array.from(new Set(availableMonths.map(month => month.getFullYear())))
              .sort((a, b) => b - a) // Most recent year first
              .map((year) => {
                const yearMonths = availableMonths.filter(month => month.getFullYear() === year);
                const isCurrentYear = year === new Date().getFullYear();
                
                return (
                  <Box key={year} sx={{ mb: 3 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isCurrentYear ? 'primary.main' : 'text.primary',
                        mb: 1,
                        px: 1
                      }}
                    >
                      {year} {isCurrentYear && <Chip label="Current" size="small" color="primary" sx={{ ml: 1, height: 20 }} />}
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: 1,
                      px: 1
                    }}>
                      {yearMonths.map((month) => {
                        const isSelected = format(month, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM');
                        const isCurrentMonth = format(month, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
                        
                        return (
                          <Button
                            key={format(month, 'yyyy-MM')}
                            variant={isSelected ? 'contained' : 'outlined'}
                            color={isCurrentMonth ? 'success' : 'primary'}
                            size="small"
                            onClick={() => {
                              handleMonthSelect(month);
                            }}
                            sx={{
                              py: 1.5,
                              fontSize: '0.85rem',
                              fontWeight: isSelected ? 600 : 500,
                              textTransform: 'none',
                              borderRadius: 1.5,
                              ...(isCurrentMonth && !isSelected && {
                                borderColor: 'success.main',
                                color: 'success.main',
                                backgroundColor: 'success.50'
                              })
                            }}
                          >
                            {format(month, 'MMM')}
                            {isCurrentMonth && (
                              <Chip 
                                label="Now" 
                                size="small" 
                                color="success"
                                sx={{ 
                                  ml: 0.5, 
                                  height: 16, 
                                  fontSize: '0.65rem',
                                  fontWeight: 600
                                }} 
                              />
                            )}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'space-between', 
          pt: 2, 
          borderTop: 1, 
          borderColor: 'divider' 
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
            Showing {availableMonths.length} months
          </Typography>
          <Button onClick={handleCloseMonthPicker} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TechnicianManagementWidget; 