import React from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import MaschinenWidget from './widgets/MaschinenWidget';

const MaschinenView: React.FC = () => {
  return (
    <Layout direction="row">
      <Column weight={1}>
        <Row>
          <Widget>
            <MaschinenWidget />
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default MaschinenView; 