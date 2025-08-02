import React, { useState } from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import CalendarWidget from '@/app/views/calendar/widgets/CalendarWidget';
import MachineSelectionWidget from '@/app/views/calendar/widgets/MachineSelectionWidget';

const CalendarView: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  return (
    <>
      <WidgetContainer
        title="Maschinen Auswahl"
        gridPosition={{ columnStart: 1, columnSpan: 3, rowStart: 2, rowSpan: 12 }}
        elevation={3}
        stretchContent
      >
        <MachineSelectionWidget 
          selectedMachine={selectedMachine}
          onMachineSelect={setSelectedMachine}
        />
      </WidgetContainer>

      <WidgetContainer
        title={selectedMachine ? `Kalender - ${selectedMachine}` : "Kalender Ansicht"}
        gridPosition={{ columnStart: 4, columnSpan: 9, rowStart: 2, rowSpan: 12 }}
        elevation={3}
        stretchContent
      >
        <CalendarWidget selectedMachine={selectedMachine} />
      </WidgetContainer>
    </>
  );
};

export default CalendarView; 