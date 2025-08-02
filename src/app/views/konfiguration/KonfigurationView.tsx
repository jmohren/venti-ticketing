import React, { useState } from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import MachinesRoomsWidget from '@/app/views/konfiguration/widgets/MachinesRoomsWidget';
import MachineCalendarWidget from '@/app/views/konfiguration/widgets/MachineCalendarWidget';
import PlaceholderWidget from '@/app/views/konfiguration/widgets/PlaceholderWidget';
import { Machine } from '@/app/hooks/useMachines';

const KonfigurationView: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  return (
  <>
    <WidgetContainer
      title="Maschinen"
      gridPosition={{ columnStart: 1, columnSpan: 4, rowStart: 2, rowSpan: 12 }}
      stretchContent
    >
      <MachinesRoomsWidget onSelect={setSelectedMachine} selectedId={selectedMachine?.id} />
    </WidgetContainer>

    <WidgetContainer
      title="Maschinen-Kalender"
      gridPosition={{ columnStart: 7, columnSpan: 6, rowStart: 2, rowSpan: 6 }}
    >
      <MachineCalendarWidget machine={selectedMachine} />
    </WidgetContainer>

    <WidgetContainer
      title="Platzhalter"
      gridPosition={{ columnStart: 7, columnSpan: 6, rowStart: 8, rowSpan: 6 }}
    >
      <PlaceholderWidget />
    </WidgetContainer>
  </>);
};

export default KonfigurationView; 