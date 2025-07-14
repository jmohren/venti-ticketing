import React from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import InstandhaltungWidget from '@/app/views/instandhaltung/widgets/InstandhaltungWidget';

const InstandhaltungView: React.FC = () => {
  const name = 'Johannes Mohren';

  return (
    <WidgetContainer
      title={`Instandhaltung - Tickets für ${name}`}
      gridPosition={{ columnStart: 1, columnSpan: 6, rowStart: 2, rowSpan: 12 }}
      stretchContent
    >
      <InstandhaltungWidget currentUser={name} />
    </WidgetContainer>
  );
};

export default InstandhaltungView; 