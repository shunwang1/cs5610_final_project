import React from 'react';
import { Alert, Box } from '@mui/material';

const ErrorAlert = ({ message }) => {
  if (!message) return null;
  
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error">
        {message || 'An error occurred. Please try again.'}
      </Alert>
    </Box>
  );
};

export default ErrorAlert; 