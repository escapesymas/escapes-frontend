import React from 'react';
import ReactDOM from 'react-dom/client';

import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import MainRoutes from './Routes';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

// @ts-ignore
const googleClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '421134638462-it8isqga2vv0pru2bf64dja2micopkvv.apps.googleusercontent.com';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider defaultTheme="dark" storageKey="escapes-theme">
          <BrowserRouter>
            <MainRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);