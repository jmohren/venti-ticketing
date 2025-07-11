import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled container for the start widget
const StartContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

const MessageTypography = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.grey[600],
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    fontSize: '2rem',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
  },
}));

const InstructionTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  color: theme.palette.grey[500],
  textAlign: 'center',
  marginTop: theme.spacing(0.5),
}));

const StartWidget: React.FC = () => {
  return (
    <StartContainer>
      <MessageTypography variant="h2">
        Describe your Idea to start building
      </MessageTypography>
      <Box sx={{ mt: 2 }}>
        <InstructionTypography>
          • Be precise in your descriptions
        </InstructionTypography>
        <InstructionTypography>
          • Make small, focused changes at a time
        </InstructionTypography>
        <InstructionTypography>
          • Review and test your changes regularly
        </InstructionTypography>
      </Box>
    </StartContainer>
  );
};

export default StartWidget; 