import React from 'react';
import WeatherTestHarness from './v2/components/testing/WeatherTestHarness';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Test App - Standalone test harness
 * Access via: /?test=true
 */
function TestApp() {
  return <WeatherTestHarness />;
}

export default TestApp;
