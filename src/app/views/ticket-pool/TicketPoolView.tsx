import React from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import TicketPoolWidget from '@/app/views/ticket-pool/widgets/TicketPoolWidget';
import TechnicianLoadWidget from '@/app/views/ticket-pool/widgets/TechnicianLoadWidget';

const TicketPoolView: React.FC = () => {
  return (
    <>
      <WidgetContainer
        title="Ticket Pool"
        gridPosition={{ columnStart: 1, columnSpan: 6, rowStart: 2, rowSpan: 12 }}
        elevation={3}
        stretchContent
      >
        <TicketPoolWidget />
      </WidgetContainer>

      <WidgetContainer
        title="Techniker Auslastung"
        gridPosition={{ columnStart: 7, columnSpan: 6, rowStart: 2, rowSpan: 6 }}
        elevation={3}
      >
        <TechnicianLoadWidget />
      </WidgetContainer>
    </>
  );
};

export default TicketPoolView; 