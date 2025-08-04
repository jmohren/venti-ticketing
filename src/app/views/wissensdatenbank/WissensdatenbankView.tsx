import React from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import WissensdatenbankWidget from '@/app/views/wissensdatenbank/widgets/WissensdatenbankWidget';

const WissensdatenbankView: React.FC = () => {
  return (
    <Layout direction="row">
      <Column weight={1}>
        <Row>
          <Widget title="Wissensdatenbank - Archivierte Tickets">
            <WissensdatenbankWidget />
          </Widget>
        </Row>
      </Column>
    </Layout>
  );
};

export default WissensdatenbankView; 