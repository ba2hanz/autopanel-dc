import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const SnackbarContext = createContext({
  showSnackbar: () => {},
  hideSnackbar: () => {}
});

export const useSnackbar = () => useContext(SnackbarContext);

export default function SnackbarProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [autoHideDuration, setAutoHideDuration] = useState(6000);

  const showSnackbar = useCallback((message, severity = 'info', duration = 6000) => {
    setMessage(message);
    setSeverity(severity);
    setAutoHideDuration(duration);
    setOpen(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    hideSnackbar();
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
} 