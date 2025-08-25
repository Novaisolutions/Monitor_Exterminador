import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';

// Inicializa Sentry solo si está configurado el DSN
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  console.log('Inicializando Sentry');
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
    integrations: [] // Se agregarán integraciones según se requiera
  });
} else {
  console.log('Sentry no está configurado');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
