import React, { useState } from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import CalendarWidget from '@/app/views/calendar/widgets/CalendarWidget';
import MachineSelectionWidget from '@/app/views/calendar/widgets/MachineSelectionWidget';

const CalendarView: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  return (
    <Layout direction="row">
      {/* Left column - Machine selection (smaller) */}
      <Column weight={1}>
        <Row>
          <Widget title="Maschinen Auswahl">
            <MachineSelectionWidget 
              selectedMachine={selectedMachine}
              onMachineSelect={setSelectedMachine}
            />
          </Widget>
        </Row>
      </Column>
      
      {/* Right column - Calendar (larger) */}
      <Column weight={3}>
        <Row>
          <Widget title="Kalender Ansicht">
            <CalendarWidget selectedMachine={selectedMachine} />
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default CalendarView; 