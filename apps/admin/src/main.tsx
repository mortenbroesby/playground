import '@mantine/core/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

const theme = createTheme({
  primaryColor: 'green',
  defaultRadius: 'xs',
  colors: {
    green: [
      '#edf9f0',
      '#d9efdf',
      '#b3dfc0',
      '#87ce9e',
      '#5fbe7f',
      '#47b26c',
      '#39ab62',
      '#2c9552',
      '#217b43',
      '#146334',
    ],
  },
  primaryShade: { dark: 6, light: 6 },
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'xs',
        size: 'xs',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xs',
        size: 'sm',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'sm',
        shadow: 'xs',
      },
    },
    Card: {
      defaultProps: {
        radius: 'sm',
        shadow: 'xs',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xs',
        size: 'xs',
      },
    },
    Select: {
      defaultProps: {
        radius: 'xs',
        size: 'xs',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'xs',
        size: 'xs',
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
