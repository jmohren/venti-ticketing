import React, { useState } from 'react';
import { Widget } from 'core/components';
import MachinesRoomsWidget from './widgets/MachinesRoomsWidget';
import MachineCalendarWidget from './widgets/MachineCalendarWidget';
import PlaceholderWidget from './widgets/PlaceholderWidget';
import { Machine } from '../../../core/hooks/useMachines';

const KonfigurationView: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  return (
  <>
    <Widget
      title="Maschinen & Räume"
      gridPosition={{ columnStart: 1, columnSpan: 6, rowStart: 2, rowSpan: 12 }}
    >
      <MachinesRoomsWidget onSelect={setSelectedMachine} selectedId={selectedMachine?.id} />
    </Widget>

    <Widget
      title="Maschinen-Kalender"
      gridPosition={{ columnStart: 7, columnSpan: 6, rowStart: 2, rowSpan: 6 }}
    >
      <MachineCalendarWidget machine={selectedMachine} />
    </Widget>

    <Widget
      title="Platzhalter"
      gridPosition={{ columnStart: 7, columnSpan: 6, rowStart: 8, rowSpan: 6 }}
    >
      <PlaceholderWidget />
    </Widget>
  </>);
};

export default KonfigurationView; 