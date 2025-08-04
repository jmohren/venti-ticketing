import React from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import AddTicketWidget from '@/app/views/add-ticket/widgets/AddTicketWidget';
import CreatedTicketsWidget from '@/app/views/add-ticket/widgets/CreatedTicketsWidget';

const AddTicketView: React.FC = () => {
  return (
    <Layout direction="row">
      {/* Left column - Ticket creation form */}
      <Column weight={1}>
        <Row>
          <Widget title="Ticket anlegen">
            <AddTicketWidget />
          </Widget>
        </Row>
      </Column>
      
      {/* Right column - Created tickets list */}
      <Column weight={1}>
        <Row>
          <Widget title="Meine erstellten Tickets">
            <CreatedTicketsWidget />
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default AddTicketView; 