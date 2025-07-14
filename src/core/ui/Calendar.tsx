import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

/**
 * Calendar – minimal monthly calendar with no custom rendering.
 * Placed in ui components folder to serve as generic reusable piece.
 */
const Calendar: React.FC = () => {
  const [value, setValue] = useState<Date | null>(new Date());

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateCalendar value={value} onChange={setValue} />
    </LocalizationProvider>
  );
};

export default Calendar; 