// App.jsx
import React from 'react';
import { WeatherProvider } from './contexts/WeatherContext';
import { WorldProvider } from './contexts/WorldContext';
import WeatherDashboard from './components/WeatherDashboard';
import './index.css';

function App() {
  return (
    <div className="app">
      <header className="app-header bg-primary-dark p-4 text-white">
        <h1 className="text-xl font-bold">GM Weather Companion</h1>
        <p className="text-sm text-gray-300">Dynamic weather for your RPG campaigns</p>
      </header>
      
      <main className="app-content">
        <WorldProvider>
          <WeatherProvider>
            <WeatherDashboard />
          </WeatherProvider>
        </WorldProvider>
      </main>
      
      <footer className="app-footer bg-primary-dark p-4 text-center text-gray-300 text-sm">
        <p>GM Weather Companion v1.0.0</p>
      </footer>
    </div>
  );
}

export default App;