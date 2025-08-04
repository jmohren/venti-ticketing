import React from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import TicketPoolWidget from '@/app/views/ticket-pool/widgets/TicketPoolWidget';
import TechnicianLoadWidget from '@/app/views/ticket-pool/widgets/TechnicianLoadWidget';
import MachinesRoomsWidget from '@/app/views/ticket-pool/widgets/MachinesRoomsWidget';

const TicketPoolView: React.FC = () => {
  return (
    <Layout direction="row">
      {/* Left column - Ticket Pool (takes half the width) */}
      <Column weight={1}>
        <Row>
          <Widget title="Ticket Pool">
            <TicketPoolWidget />
          </Widget>
        </Row>
      </Column>
      
      {/* Right column - Two stacked widgets (takes half the width) */}
      <Column weight={1}>
        {/* Top widget - Technician Load */}
        <Row weight={1}>
          <Widget title="Techniker Auslastung">
            <TechnicianLoadWidget />
          </Widget>
        </Row>
        
        {/* Bottom widget - Machines */}
        <Row weight={1}>
          <Widget title="Maschinen">
            <MachinesRoomsWidget />
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default TicketPoolView; 