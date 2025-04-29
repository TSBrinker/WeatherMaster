// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import WeatherTestUI from './components/WeatherTestUI';

// Create the root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
}

// Render the application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WeatherTestUI />
  </React.StrictMode>
);