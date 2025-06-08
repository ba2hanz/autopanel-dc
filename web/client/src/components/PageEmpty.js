import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

export default function PageEmpty({
  message = 'No data available',
  action,
  actionText,
  actionIcon
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
      <InboxIcon
        sx={{
          fontSize: 64,
          opacity: 0.5,
          color: 'text.secondary'
        }}
      />
      <Typography variant="h5" component="h2" gutterBottom>
        {message}
      </Typography>
      {action && actionText && (
        <Button
          variant="contained"
          color="primary"
          startIcon={actionIcon}
          onClick={action}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
} 