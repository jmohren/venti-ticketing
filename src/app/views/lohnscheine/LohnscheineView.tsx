import React from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import TechnicianManagementWidget from './widgets/TechnicianManagementWidget';

const LohnscheineView: React.FC = () => {
  return (
    <Layout direction="row">
      <Column weight={1}>
        <Row>
          <Widget>
            <TechnicianManagementWidget />
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default LohnscheineView; 