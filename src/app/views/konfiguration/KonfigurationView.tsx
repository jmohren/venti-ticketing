import React, { useState } from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import MachinesRoomsWidget from '@/app/views/konfiguration/widgets/MachinesRoomsWidget';
import MachineCalendarWidget from '@/app/views/konfiguration/widgets/MachineCalendarWidget';
import PlaceholderWidget from '@/app/views/konfiguration/widgets/PlaceholderWidget';
import { Machine } from '@/app/hooks/useMachines';

const KonfigurationView: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  return (
    <Layout direction="row">
      {/* Left column - Machines (takes 1/3 of width) */}
      <Column weight={1}>
        <Row>
          <Widget title="Maschinen">
            <MachinesRoomsWidget onSelect={setSelectedMachine} selectedId={selectedMachine?.equipment_number} />
          </Widget>
        </Row>
      </Column>
      
      {/* Right column - Two stacked widgets (takes 2/3 of width) */}
      <Column weight={2}>
        {/* Top widget - Machine Calendar */}
        <Row weight={1}>
          <Widget title="Maschinen-Kalender">
            <MachineCalendarWidget machine={selectedMachine} />
          </Widget>
        </Row>
        
        {/* Bottom widget - Placeholder */}
        <Row weight={1}>
          <Widget title="Platzhalter">
            <PlaceholderWidget />
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default KonfigurationView; 