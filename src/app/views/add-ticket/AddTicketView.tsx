import React from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import AddTicketWidget from '@/app/views/add-ticket/widgets/AddTicketWidget';
import CreatedTicketsWidget from '@/app/views/add-ticket/widgets/CreatedTicketsWidget';

const AddTicketView: React.FC = () => {
  return (
    <>
      <WidgetContainer
        title="Ticket anlegen"
        gridPosition={{ columnStart: 1, columnSpan: 6, rowStart: 2, rowSpan: 12 }}
        elevation={3}
      >
        <AddTicketWidget />
      </WidgetContainer>

      <WidgetContainer
        title="Meine erstellten Tickets"
        gridPosition={{ columnStart: 7, columnSpan: 6, rowStart: 2, rowSpan: 12 }}
        elevation={3}
        stretchContent
      >
        <CreatedTicketsWidget />
      </WidgetContainer>
    </>
  );
};

export default AddTicketView; 