import React from 'react';
import { Container, Box } from '@mui/material';

export default function PageContainer({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  sx = {}
}) {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        py: 3,
        ...sx
      }}
    >
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px - 48px)', // Viewport height minus header and padding
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Container>
  );
} 