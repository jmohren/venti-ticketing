import React from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import TechnicianManagementWidget from './widgets/TechnicianManagementWidget';

const LohnscheineView: React.FC = () => {
  return (
    <>
      <WidgetContainer
        gridPosition={{ columnStart: 1, columnSpan: 12, rowStart: 2, rowSpan: 12 }}
        elevation={3}
        stretchContent
      >
        <TechnicianManagementWidget />
      </WidgetContainer>
    </>
  );
};

export default LohnscheineView; 