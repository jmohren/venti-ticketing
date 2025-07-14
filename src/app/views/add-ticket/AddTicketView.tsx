import React from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import AddTicketWidget from '@/app/views/add-ticket/widgets/AddTicketWidget';

const AddTicketView: React.FC = () => {
  return (
    <>
      <WidgetContainer
        title="Ticket anlegen"
        gridPosition={{ columnStart: 1, columnSpan: 12, rowStart: 2, rowSpan: 12 }}
        elevation={3}
      >
        <AddTicketWidget />
      </WidgetContainer>
    </>
  );
};

export default AddTicketView; 