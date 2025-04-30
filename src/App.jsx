// App.jsx
import React, { useState, useEffect } from 'react';
import WeatherTestUIWithRolls from './components/WeatherTestUIWithRolls';
import WeatherTestUI from './components/WeatherTestUI';
import StorageService from './services/storage-service';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this package

function App() {
  const [storageService] = useState(() => new StorageService());
  const [appData, setAppData] = useState(null);
  const [activeView, setActiveView] = useState('weather'); // 'weather', 'worlds', 'regions', 'locations'
  
  // Initialize app data on first load
  useEffect(() => {
    const data = storageService.initialize();
    setAppData(data);
    
    // Check if we need to set up first-time user experience
    if (!data.worlds || data.worlds.length === 0) {
      setActiveView('setup');
    }
  }, [storageService]);

  // Create example world if none exists
  const createExampleWorld = () => {
    const worldId = uuidv4();
    const regionId = uuidv4();
    const locationId = uuidv4();
    
    const exampleWorld = {
      id: worldId,
      name: 'Example World',
      calendar: 'gregorian',
      startDate: new Date().toISOString(),
      winterSolstice: '12-21', // MM-DD format
      summerSolstice: '06-21',
      springEquinox: '03-20',
      fallEquinox: '09-22',
      regions: [
        {
          id: regionId,
          name: 'Temperate Region',
          climate: 'temperate',
          locations: [
            {
              id: locationId,
              name: 'Starting Village',
              currentDate: new Date().toISOString(),
              weatherData: null // Will be initialized when first viewed
            }
          ]
        }
      ]
    };
    
    storageService.saveWorld(exampleWorld);
    storageService.setActiveLocation(worldId, regionId, locationId);
    
    const updatedData = storageService.getData();
    setAppData(updatedData);
    setActiveView('weather');
  };

  // Render loading state
  if (!appData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }
  
  // Render first-time setup
  if (activeView === 'setup') {
    return (
      <div style={{ 
        maxWidth: '500px', 
        margin: '100px auto', 
        padding: '30px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h1>Welcome to GM Weather Companion</h1>
        <p>It looks like this is your first time using the app. Let's set things up!</p>
        <p>You can either create an example world to get started quickly, or set up your own custom world.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
          <button 
            onClick={createExampleWorld}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Create Example World
          </button>
          <button
            onClick={() => setActiveView('worlds')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Create Custom World
          </button>
        </div>
      </div>
    );
  }

  // For now, just render the WeatherTestUI since we're focused on testing the core functionality
  return (
    <div>
      <header style={{ 
        backgroundColor: '#333', 
        color: 'white', 
        padding: '10px 20px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0 }}>GM Weather Companion</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>
          Testing core weather generation and time progression
        </p>
      </header>
      
      {/* <WeatherTestUIWithRolls /> */}
      <WeatherTestUI />
      
      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        marginTop: '40px',
        borderTop: '1px solid #ddd',
        color: '#666',
        fontSize: '0.8rem'
      }}>
        <p>GM Weather Companion v1.0.0</p>
        <button 
          onClick={() => storageService.clearData() && window.location.reload()}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#f44336', 
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Reset App Data
        </button>
      </footer>
    </div>
  );
}

export default App;