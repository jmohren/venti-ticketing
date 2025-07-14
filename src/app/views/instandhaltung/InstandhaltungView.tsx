import React from 'react';
import Widget from '../../../components/Widget';
import InstandhaltungWidget from './widgets/InstandhaltungWidget';

const InstandhaltungView: React.FC = () => {
  const name = 'Johannes';

  return (
    <Widget
      title={`Instandhaltung - Tickets für ${name}`}
      gridPosition={{ columnStart: 1, columnSpan: 6, rowStart: 2, rowSpan: 12 }}
      stretchContent
    >
      <InstandhaltungWidget currentUser={name} />
    </Widget>
  );
};

export default InstandhaltungView; 