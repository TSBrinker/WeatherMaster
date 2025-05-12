// src/services/meteorological/index.js
// Central export for all meteorological services

import TemperatureService from './TemperatureService';
import AtmosphericService from './AtmosphericService';
import WindService from './WindService';
import WeatherSystemService from './WeatherSystemService';
import WeatherConditionService from './WeatherConditionService';
import RegionProfileService from './RegionProfileService';
import PrecipitationService from './PrecipitationService';
import ExtremeWeatherService from './ExtremeWeatherService';
import WeatherUtils from './WeatherUtils';

export {
  TemperatureService,
  AtmosphericService,
  WindService,
  WeatherSystemService,
  WeatherConditionService,
  RegionProfileService,
  PrecipitationService,
  ExtremeWeatherService,
  WeatherUtils
};

// Default export for convenience
export default {
  TemperatureService,
  AtmosphericService,
  WindService,
  WeatherSystemService,
  WeatherConditionService,
  RegionProfileService,
  PrecipitationService,
  ExtremeWeatherService,
  WeatherUtils
};