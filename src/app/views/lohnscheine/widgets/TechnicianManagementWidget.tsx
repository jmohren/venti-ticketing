import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';

import { useTechnicians } from '@/app/hooks/useTechnicians';
import { restApiClient } from '@/core/api/rest/RestApiClient';
import { Ticket } from '@/app/hooks/useTickets';
import { format, startOfMonth, endOfMonth } from 'date-fns';




const TechnicianManagementWidget: React.FC = () => {

  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>(''); // userId of selected technician
  const [technicianTickets, setTechnicianTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  
  // Use the shared technician provider
  const { 
    technicians, 
    error: technicianError, 
    getTechnicianDisplayName,
  } = useTechnicians();
  


  // Load tickets for selected technician and month
  const loadTechnicianTickets = useCallback(async (technicianUserId: string, month: Date) => {
    if (!technicianUserId) {
      setTechnicianTickets([]);
      return;
    }

    setLoadingTickets(true);
    setTicketError(null);

    try {
      const startDate = startOfMonth(month).toISOString();
      const endDate = endOfMonth(month).toISOString();
      
      // Query for tickets assigned to this technician, completed in this month
      // Note: PostgREST doesn't support range queries easily, so we'll filter client-side
      const allTickets = await restApiClient.get('tickets', {
        responsible: `eq.${technicianUserId}`,
        order: ['completedAt.desc']
      });
      
      // Filter by completion date range on client side
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();
      
      const tickets = allTickets.filter((ticket: Ticket) => {
        if (!ticket.completedAt) return false;
        const completedTime = new Date(ticket.completedAt).getTime();
        return completedTime >= startTime && completedTime <= endTime;
      });
      
      setTechnicianTickets(tickets);
    } catch (error) {
      console.error('Error loading technician tickets:', error);
      setTicketError(error instanceof Error ? error.message : 'Failed to load tickets');
      setTechnicianTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Load tickets when technician or month changes
  useEffect(() => {
    if (selectedTechnician) {
      loadTechnicianTickets(selectedTechnician, selectedMonth);
    }
  }, [selectedTechnician, selectedMonth, loadTechnicianTickets]);

  // Selected month for performance stats
  const currentMonth = useMemo(() => {
    return {
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth),
      name: format(selectedMonth, 'MMMM yyyy')
    };
  }, [selectedMonth]);





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



  // Combined loading and error states
  const error = technicianError;

  return (
    <>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Combined Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 2,
          py: 1,
          backgroundColor: 'grey.100'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Technician Selector */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Technician</InputLabel>
              <Select
                value={selectedTechnician}
                label="Technician"
                onChange={(e) => setSelectedTechnician(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select Technician</em>
                </MenuItem>
                {technicians.map((tech) => (
                  <MenuItem key={tech.id} value={tech.userId}>
                    {getTechnicianDisplayName(tech)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Chip 
              label={currentMonth.name} 
              size="small" 
              color="primary" 
              variant="outlined"
              onClick={handleOpenMonthPicker}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ px: 2, pb: 1 }}>
            {error}
          </Typography>
        )}

        {/* Ticket List for Selected Technician */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {!selectedTechnician ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Select a technician to view their tickets
              </Typography>
            </Box>
          ) : (
            <>
              {/* Summary Header */}
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Typography variant="h6">
                    {technicians.find(t => t.userId === selectedTechnician) && 
                      getTechnicianDisplayName(technicians.find(t => t.userId === selectedTechnician)!)
                    } - {currentMonth.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tickets completed:</strong> {technicianTickets.length}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total work time:</strong> {(() => {
                      const totalMinutes = technicianTickets.reduce((sum, ticket) => sum + (ticket.totalWorkTimeMinutes || 0), 0);
                      if (totalMinutes < 60) return `${totalMinutes}m`;
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                    })()}
                  </Typography>
                </Box>
              </Box>

              {/* Loading State */}
              {loadingTickets && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* Error State */}
              {ticketError && (
                <Box sx={{ p: 2 }}>
                  <Typography color="error">
                    Error loading tickets: {ticketError}
                  </Typography>
                </Box>
              )}

              {/* Ticket Table */}
              {!loadingTickets && !ticketError && (
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell sx={{ width: '80px', fontWeight: 600 }}>Ticket</TableCell>
                        <TableCell sx={{ width: '200px', fontWeight: 600 }}>Machine</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        <TableCell sx={{ width: '140px', fontWeight: 600 }}>Completed</TableCell>
                        <TableCell align="right" sx={{ width: '100px', fontWeight: 600 }}>Work Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {technicianTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No tickets completed in this month
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              This technician has no completed tickets for the selected month
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        technicianTickets.map((ticket) => (
                          <TableRow key={ticket.id} hover>
                            <TableCell>
                              <Typography variant="body2">
                                #{ticket.id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {ticket.machine}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {ticket.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {ticket.completedAt ? format(new Date(ticket.completedAt), 'dd.MM.yyyy HH:mm') : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {(() => {
                                  const minutes = ticket.totalWorkTimeMinutes || 0;
                                  if (minutes < 60) return `${minutes}m`;
                                  const hours = Math.floor(minutes / 60);
                                  const remainingMinutes = minutes % 60;
                                  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
                                })()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </Box>




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