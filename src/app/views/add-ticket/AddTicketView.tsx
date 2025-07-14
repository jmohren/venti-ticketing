import React from 'react';
import { Widget } from '@/core/components/Widget';
import AddTicketWidget from './widgets/AddTicketWidget';

const AddTicketView: React.FC = () => {
  return (
    <>
      <Widget
        title="Ticket anlegen"
        gridPosition={{ columnStart: 1, columnSpan: 12, rowStart: 2, rowSpan: 12 }}
        elevation={3}
      >
        <AddTicketWidget />
      </Widget>
    </>
  );
};

export default AddTicketView; 