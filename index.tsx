import React from 'react';
import ReactDOM from 'react-dom/client';

import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import MainRoutes from './Routes';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark" storageKey="escapes-theme">
        <BrowserRouter>
          <MainRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
);