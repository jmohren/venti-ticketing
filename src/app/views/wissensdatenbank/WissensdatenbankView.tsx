import React from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import WissensdatenbankWidget from '@/app/views/wissensdatenbank/widgets/WissensdatenbankWidget';

const WissensdatenbankView: React.FC = () => {
  return (
    <WidgetContainer
      title="Wissensdatenbank - Archivierte Tickets"
      gridPosition={{ columnStart: 1, columnSpan: 12, rowStart: 2, rowSpan: 12 }}
      elevation={3}
      stretchContent
    >
      <WissensdatenbankWidget />
    </WidgetContainer>
  );
};

export default WissensdatenbankView; 