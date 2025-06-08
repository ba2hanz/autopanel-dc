import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext({
  mode: 'dark',
  toggleMode: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#5865F2', // Discord blue
            light: '#7986CB',
            dark: '#303F9F'
          },
          secondary: {
            main: '#EB459E', // Discord pink
            light: '#F48FB1',
            dark: '#C2185B'
          },
          background: {
            default: mode === 'dark' ? '#36393F' : '#FFFFFF',
            paper: mode === 'dark' ? '#2F3136' : '#F8F9FA'
          },
          text: {
            primary: mode === 'dark' ? '#FFFFFF' : '#000000',
            secondary: mode === 'dark' ? '#B9BBBE' : '#4F545C'
          }
        },
        typography: {
          fontFamily: [
            'Whitney',
            'Helvetica Neue',
            'Helvetica',
            'Arial',
            'sans-serif'
          ].join(','),
          h1: {
            fontSize: '2.5rem',
            fontWeight: 700
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 700
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 600
          }
        },
        shape: {
          borderRadius: 8
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500
              }
            }
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'dark'
                  ? '0 2px 4px rgba(0,0,0,0.2)'
                  : '0 2px 4px rgba(0,0,0,0.1)'
              }
            }
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                borderBottom: `1px solid ${
                  mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }`
              }
            }
          }
        }
      }),
    [mode]
  );

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(
    () => ({
      mode,
      toggleMode
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
} 