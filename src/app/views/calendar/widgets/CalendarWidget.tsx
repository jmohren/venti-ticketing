import React, { useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ChevronLeft,
  ChevronRight,
  CalendarViewWeek,
  CalendarViewMonth,
} from '@mui/icons-material';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subWeeks, subMonths, isSameDay, isToday, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTickets } from '@/app/hooks/useTickets';
import { useMachines } from '@/app/hooks/useMachines';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';
import { generateMachineTaskOccurrences, TaskOccurrence } from '@/app/utils/recurringTasks';

type CalendarView = 'week' | 'month';

interface CalendarWidgetProps {
  selectedMachine: string | null;
}

const priorityColor = {
  rot: '#d32f2f',
  gelb: '#f9a825',
  gruen: '#2e7d32',
} as const;

// Styled components matching table design patterns
const CalendarHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderBottom: `2px solid ${theme.palette.grey[300]}`,
  fontWeight: 'bold',
}));

const CalendarCell = styled(Box)(({ theme }) => ({
  padding: '8px 16px',
  borderRight: `1px solid ${theme.palette.divider}`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '60px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
  },
  '&:last-child': {
    borderRight: 0,
  },
}));

const CalendarHeaderCell = styled(Box)(({ theme }) => ({
  padding: '8px 16px',
  borderRight: `1px solid ${theme.palette.grey[300]}`,
  backgroundColor: theme.palette.grey[50],
  fontWeight: 'bold',
  textAlign: 'center',
  '&:last-child': {
    borderRight: 0,
  },
}));

const TodayCell = styled(CalendarCell)(({ theme }) => ({
  backgroundColor: `${theme.palette.primary.light}20`,
  '&:hover': {
    backgroundColor: `${theme.palette.primary.light}30 !important`,
  },
}));

const TicketCard = styled(Card)<{ borderColor?: string }>(({ theme, borderColor }) => ({
  margin: '2px 0',
  padding: 0,
  cursor: 'pointer',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  borderLeft: borderColor ? `4px solid ${borderColor}` : `4px solid ${theme.palette.grey[300]}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    boxShadow: theme.shadows[2],
  },
}));

const TicketCardContent = styled(CardContent)(({ theme }) => ({
  padding: '4px 8px !important',
  '&:last-child': {
    paddingBottom: '4px !important',
  },
}));

const MaintenanceCard = styled(Card)(({ theme }) => ({
  margin: '2px 0',
  padding: 0,
  cursor: 'pointer',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    boxShadow: theme.shadows[2],
  },
}));

const MaintenanceCardContent = styled(CardContent)(({ theme }) => ({
  padding: '4px 8px !important',
  '&:last-child': {
    paddingBottom: '4px !important',
  },
}));

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ selectedMachine }) => {
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [selectedMaintenanceTask, setSelectedMaintenanceTask] = useState<TaskOccurrence | null>(null);
  const { tickets } = useTickets();
  const { getAllMachines } = useMachines();

  // Filter tickets for the selected machine with planned completion dates
  const machineTickets = React.useMemo(() => {
    if (!selectedMachine) return [];
    return tickets.filter(ticket => 
      ticket.machine === selectedMachine && 
      ticket.plannedCompletion && 
      ticket.status !== 'archived'
    );
  }, [tickets, selectedMachine]);

  // Generate recurring maintenance tasks for the selected machine
  const maintenanceTasks = React.useMemo(() => {
    if (!selectedMachine) return [];
    
    const allMachines = getAllMachines();
    const machine = allMachines.find(m => m.name === selectedMachine);
    if (!machine) return [];

    // Calculate date range for current view (extend by 1 month on each side for safety)
    const startRange = view === 'week' 
      ? startOfWeek(addWeeks(currentDate, -2), { weekStartsOn: 1 })
      : startOfMonth(addMonths(currentDate, -1));
    const endRange = view === 'week'
      ? endOfWeek(addWeeks(currentDate, 2), { weekStartsOn: 1 })
      : endOfMonth(addMonths(currentDate, 1));

    return generateMachineTaskOccurrences(machine, startRange, endRange);
  }, [selectedMachine, getAllMachines, currentDate, view]);

  // Get tickets for a specific date
  const getTicketsForDate = (date: Date) => {
    return machineTickets.filter(ticket => {
      if (!ticket.plannedCompletion) return false;
      try {
        const ticketDate = parseISO(ticket.plannedCompletion);
        return isSameDay(ticketDate, date);
      } catch {
        return false;
      }
    });
  };

  // Get maintenance tasks for a specific date
  const getMaintenanceTasksForDate = (date: Date) => {
    return maintenanceTasks.filter(task => isSameDay(task.date, date));
  };

  const handleTicketClick = (ticketId: number) => {
    setSelectedTicket(ticketId);
  };

  const handleMaintenanceTaskClick = (taskOccurrence: TaskOccurrence) => {
    setSelectedMaintenanceTask(taskOccurrence);
  };

  // Render ticket cards and maintenance tasks for a date
  const renderTicketCards = (date: Date) => {
    const dayTickets = getTicketsForDate(date);
    const dayMaintenanceTasks = getMaintenanceTasksForDate(date);
    
    const cards: React.ReactElement[] = [];
    
    // Add regular tickets
    dayTickets.forEach(ticket => {
      cards.push(
        <TicketCard 
          key={`ticket-${ticket.id}`} 
          onClick={() => handleTicketClick(ticket.id)}
          borderColor={priorityColor[ticket.priority]}
        >
          <TicketCardContent>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {ticket.description}
            </Typography>
          </TicketCardContent>
        </TicketCard>
      );
    });
    
    // Add maintenance tasks
    dayMaintenanceTasks.forEach(task => {
      cards.push(
        <MaintenanceCard 
          key={`maintenance-${task.id}`} 
          onClick={() => handleMaintenanceTaskClick(task)}
        >
          <MaintenanceCardContent>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              🔧 {task.title}
            </Typography>
          </MaintenanceCardContent>
        </MaintenanceCard>
      );
    });
    
    return cards;
  };

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: CalendarView | null) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handlePrevious = () => {
    if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];

    for (let day = weekStart; day <= weekEnd; day = addDays(day, 1)) {
      days.push(day);
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', border: 1, borderColor: 'divider' }}>
        {/* Day headers */}
        <CalendarHeader sx={{ display: 'flex' }}>
          {days.map((day) => {
            const isMonday = day.getDay() === 1;
            const dayName = format(day, 'EEE', { locale: de });
            const dayNumber = format(day, 'd');
            
            return (
              <CalendarHeaderCell
                key={day.toISOString()}
                sx={{ flex: 1 }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}
                >
                  {dayName} {dayNumber}
                </Typography>
              </CalendarHeaderCell>
            );
          })}
        </CalendarHeader>

        {/* Calendar content area */}
        <Box sx={{ display: 'flex', flex: 1 }}>
          {days.map((day) => {
            const CellComponent = isToday(day) ? TodayCell : CalendarCell;
            return (
              <CellComponent
                key={day.toISOString()}
                sx={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}
              >
                {renderTicketCards(day)}
              </CellComponent>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = [];
    for (let day = calendarStart; day <= calendarEnd; day = addDays(day, 1)) {
      days.push(day);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', border: 1, borderColor: 'divider' }}>
        {/* Day headers */}
        <CalendarHeader sx={{ display: 'flex' }}>
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((dayName) => (
            <CalendarHeaderCell key={dayName} sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {dayName}
              </Typography>
            </CalendarHeaderCell>
          ))}
        </CalendarHeader>

        {/* Month grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {weeks.map((week, weekIndex) => (
            <Box key={weekIndex} sx={{ display: 'flex', flex: 1 }}>
              {week.map((day) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isDayToday = isToday(day);
                const CellComponent = isDayToday ? TodayCell : CalendarCell;

                return (
                  <CellComponent
                    key={day.toISOString()}
                    sx={{
                      flex: 1,
                      minHeight: 100,
                      opacity: isCurrentMonth ? 1 : 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isDayToday ? 'bold' : 'normal',
                        fontSize: '0.875rem',
                        mb: 1,
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>
                    {renderTicketCards(day)}
                  </CellComponent>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Calendar header with navigation and view toggle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
        }}
      >
        {/* Empty space for balance */}
        <Box sx={{ minWidth: 120 }} />

        {/* Navigation - center aligned */}
        <Box sx={{ 
          position: 'absolute', 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <IconButton onClick={handlePrevious}>
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ minWidth: 200, textAlign: 'center', cursor: 'pointer' }}
            onClick={handleToday}
          >
            {view === 'week'
              ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')}`
              : format(currentDate, 'MMMM yyyy', { locale: de })}
          </Typography>
          <IconButton onClick={handleNext}>
            <ChevronRight />
          </IconButton>
        </Box>

        {/* View toggle - right aligned */}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="week" aria-label="week view">
            <CalendarViewWeek sx={{ mr: 1 }} />
            Woche
          </ToggleButton>
          <ToggleButton value="month" aria-label="month view">
            <CalendarViewMonth sx={{ mr: 1 }} />
            Monat
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Calendar content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {view === 'week' ? renderWeekView() : renderMonthView()}
      </Box>

      {/* Ticket Dialog */}
      {selectedTicket && (
        <AddTicketDialog
          open={selectedTicket !== null}
          onClose={() => setSelectedTicket(null)}
          initialData={tickets.find(t => t.id === selectedTicket)}
          readOnly={true}
        />
      )}

      {/* Maintenance Task Dialog */}
      {selectedMaintenanceTask && (
        <Dialog
          open={selectedMaintenanceTask !== null}
          onClose={() => setSelectedMaintenanceTask(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Wartungsaufgabe Details</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="h6">{selectedMaintenanceTask.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Maschine:</strong> {selectedMaintenanceTask.machineName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Datum:</strong> {format(selectedMaintenanceTask.date, 'dd.MM.yyyy', { locale: de })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Typ:</strong> Wiederkehrende Wartungsaufgabe
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedMaintenanceTask(null)}>Schließen</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CalendarWidget; 