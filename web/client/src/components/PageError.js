import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

export default function PageError({
  message = 'Something went wrong',
  retry,
  retryText = 'Try Again'
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px - 48px)', // Viewport height minus header and padding
        gap: 2,
        textAlign: 'center',
        px: 2
      }}
    >
      <ErrorIcon
        color="error"
        sx={{
          fontSize: 64,
          opacity: 0.8
        }}
      />
      <Typography variant="h5" component="h2" gutterBottom>
        {message}
      </Typography>
      {retry && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={retry}
        >
          {retryText}
        </Button>
      )}
    </Box>
  );
} 