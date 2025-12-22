// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './v2/App';
import TestApp from './TestApp';

// Check if test mode is enabled via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const isTestMode = urlParams.get('test') === 'true';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isTestMode ? <TestApp /> : <App />}
  </React.StrictMode>
);
