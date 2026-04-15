import './polyfills';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthKitProvider } from '@workos-inc/authkit-react';
import App from './App';
import './globals.css';

const clientId = import.meta.env.VITE_WORKOS_CLIENT_ID;
const apiHostname = import.meta.env.VITE_WORKOS_API_HOSTNAME?.trim() || undefined;

if (!clientId) {
  throw new Error('Missing VITE_WORKOS_CLIENT_ID');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthKitProvider
      clientId={clientId}
      apiHostname={apiHostname}
      devMode={!apiHostname}
      redirectUri={`${window.location.origin}/callback`}
      onRedirectCallback={() => {
        window.history.replaceState({}, '', '/');
      }}
    >
      <App />
    </AuthKitProvider>
  </StrictMode>
);
