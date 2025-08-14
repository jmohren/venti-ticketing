import React from 'react';
import { Layout, Row, Column, Widget } from '@/core/components/GridLayout';
import { useUser } from '@/core/state/UserProvider';
import InstandhaltungWidget from '@/app/views/instandhaltung/widgets/InstandhaltungWidget';

const InstandhaltungView: React.FC = () => {
  const { user, profile } = useUser();
  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const currentUserId = user?.userId || '';

  return (
    <Layout direction="row">
      {/* Left column - Instandhaltung widget */}
      <Column weight={1}>
        <Row>
          <Widget title={`Instandhaltung - Tickets für ${displayName}`}>
            <InstandhaltungWidget currentUserId={currentUserId} />
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