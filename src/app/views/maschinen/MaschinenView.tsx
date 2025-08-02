import React from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import MaschinenWidget from './widgets/MaschinenWidget';

const MaschinenView: React.FC = () => {
  return (
    <>
      <WidgetContainer
        gridPosition={{ columnStart: 1, columnSpan: 12, rowStart: 2, rowSpan: 12 }}
        elevation={3}
        stretchContent
      >
        <MaschinenWidget />
      </WidgetContainer>
    </>
  );
};

export default MaschinenView; 