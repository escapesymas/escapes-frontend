import React from 'react';
import ReactDOM from 'react-dom/client';

import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import MainRoutes from './Routes';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);