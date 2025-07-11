import React from 'react';
import Widget from '../../../components/Widget';
import StartWidget from './widgets/StartWidget';

const StartView: React.FC = () => {
  return (
    <>
      {/* Start Widget */}
      <Widget 
        gridPosition={{ columnStart: 1, columnSpan: 12, rowStart: 2, rowSpan: 12 }}
        elevation={3}
      >
        <StartWidget />
      </Widget>
    </>
  );
};

export default StartView; 