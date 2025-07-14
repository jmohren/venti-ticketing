import React, { useState, useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Badge } from '@mui/material';
import { Machine, useMachines } from '@/app/hooks/useMachines';
import { useTickets } from '@/app/hooks/useTickets';
import { DateCalendar, PickersDay, LocalizationProvider, PickersDayProps } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import dayjs from 'dayjs';
import { format as formatDateFn } from 'date-fns';

interface CalendarEvent { date: string; label: string; color: 'primary' | 'secondary'; }

interface Props { machine: (Machine & { roomId: string }) | null; }

const MachineCalendarWidget: React.FC<Props> = ({ machine }) => {
  const { tickets } = useTickets();
  const { getRoom } = useMachines();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Get room name for the selected machine
  const room = machine ? getRoom(machine.roomId) : null;

  // build events for the current machine
  const events: CalendarEvent[] = useMemo(() => {
    if (!machine) return [];
    const result: CalendarEvent[] = [];
    // tickets not done yet
    tickets.filter(t => t.machine === machine.name && t.status !== 'done').forEach(t => {
      result.push({ date: dayjs().format('YYYY-MM-DD'), label: `Ticket: ${t.description}`, color: 'secondary' });
    });
    // tasks recurrence (simple: daily tasks create event for each day of current month)
    machine.tasks?.forEach(task => {
      if (task.recurrence === 'daily') {
        const start = dayjs().startOf('month');
        const end = dayjs().endOf('month');
        for (let d = start; d.isBefore(end); d = d.add(1, 'day')) {
          result.push({ date: d.format('YYYY-MM-DD'), label: task.title, color: 'primary' });
        }
      }
      if (task.recurrence === 'weekly') {
        const start = dayjs().startOf('month');
        const end = dayjs().endOf('month');
        for (let d = start; d.isBefore(end); d = d.add(1, 'week')) {
          result.push({ date: d.format('YYYY-MM-DD'), label: task.title, color: 'primary' });
        }
      }
      if (task.recurrence === 'yearly') {
        const day = dayjs().date(1); // first of month
        result.push({ date: day.format('YYYY-MM-DD'), label: task.title, color: 'primary' });
      }
    });
    return result;
  }, [machine, tickets]);

  const CustomDay = (props: PickersDayProps<Date>) => {
    const { day, ...other } = props;
    
    // Ensure day is a valid Date object
    if (!day || !(day instanceof Date)) {
      return <PickersDay {...other} day={day} />;
    }

    const dateStr = formatDateFn(day, 'yyyy-MM-dd');
    const hasEvent = events.some(e => e.date === dateStr);
    
    return (
      <Badge 
        key={dateStr} 
        overlap="circular" 
        variant={hasEvent ? 'dot' : undefined} 
        color="primary"
      >
        <PickersDay {...other} day={day} />
      </Badge>
    );
  };

  const eventsForSelected = events.filter(e => e.date === formatDateFn(selectedDay, 'yyyy-MM-dd'));

  return (
    <Box sx={{ p:2, height:'100%', display:'flex', flexDirection:'column' }}>
      <Typography variant="h6">Maschinen-Kalender</Typography>
      {machine ? (
        <>
          <Typography variant="subtitle2" sx={{ mb:1 }}>{machine.name} – {room?.name || 'Unbekannter Raum'}</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar 
              value={selectedDay} 
              onChange={(d)=>setSelectedDay(d as Date)} 
              slots={{ day: CustomDay }} 
              sx={{ alignSelf:'center' }} 
            />
          </LocalizationProvider>
          <Box sx={{ flex:1, overflowY:'auto' }}>
            {eventsForSelected.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Keine Ereignisse an diesem Tag.</Typography>
            ) : (
              <List dense>
                {eventsForSelected.map((ev,index)=>(<ListItem key={index}><ListItemText primary={ev.label} /></ListItem>))}
              </List>
            )}
          </Box>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">Bitte Maschine wählen...</Typography>
      )}
    </Box>
  );
};

export default MachineCalendarWidget; 