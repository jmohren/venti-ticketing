import React from 'react';
import Widget from '../../../components/Widget';
import TicketPoolWidget from './widgets/TicketPoolWidget';
import TechnicianLoadWidget from './widgets/TechnicianLoadWidget';

const TicketPoolView: React.FC = () => {
  return (
    <>
      <Widget
        title="Ticket Pool"
        gridPosition={{ columnStart: 1, columnSpan: 6, rowStart: 2, rowSpan: 12 }}
        elevation={3}
        stretchContent
      >
        <TicketPoolWidget />
      </Widget>

      <Widget
        title="Techniker Auslastung"
        gridPosition={{ columnStart: 7, columnSpan: 6, rowStart: 2, rowSpan: 6 }}
        elevation={3}
      >
        <TechnicianLoadWidget />
      </Widget>
    </>
  );
};

export default TicketPoolView; 