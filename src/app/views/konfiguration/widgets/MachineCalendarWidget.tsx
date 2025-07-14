import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Machine } from '../../../../core/hooks/useMachines';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Props {
  machine: Machine | null;
}

/**
 * MachineCalendarWidget – currently shows a plain monthly calendar with no
 * custom day rendering or event logic to guarantee zero runtime errors.
 */
const MachineCalendarWidget: React.FC<Props> = ({ machine }) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6">Maschinen-Kalender</Typography>

      {machine ? (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {machine.name} – {machine.room}
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              value={selectedDay}
              onChange={(d) => setSelectedDay(d as Date | null)}
              sx={{ alignSelf: 'center' }}
            />
          </LocalizationProvider>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Bitte Maschine wählen...
        </Typography>
      )}
    </Box>
  );
};

export default MachineCalendarWidget; 