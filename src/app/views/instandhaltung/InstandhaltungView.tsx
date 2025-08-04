import React from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import InstandhaltungWidget from '@/app/views/instandhaltung/widgets/InstandhaltungWidget';

const InstandhaltungView: React.FC = () => {
  const name = 'Johannes Mohren';

  return (
    <Layout direction="row">
      {/* Left column - Instandhaltung widget */}
      <Column weight={1}>
        <Row>
          <Widget title={`Instandhaltung - Tickets für ${name}`}>
            <InstandhaltungWidget currentUser={name} />
          </Widget>
        </Row>
      </Column>
      
      {/* Right column - Empty placeholder */}
      <Column weight={1}>
        <Row>
          <Widget>
            {/* Empty placeholder content */}
            <div style={{ padding: '16px', color: '#666' }}>
            </div>
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default InstandhaltungView; 