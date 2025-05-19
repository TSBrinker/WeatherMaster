// src/components/onboarding/FirstTimeSetup.jsx
import React, { useState } from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";
import { usePreferences } from "../../contexts/PreferencesContext";

const FirstTimeSetup = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const { setWorldName, setGameTime, setIsConfigured } = useWorldSettings();
  const { setWeatherSystem } = usePreferences();

  const [worldData, setWorldData] = useState({
    worldName: "My Fantasy World",
    gameDate: new Date().toISOString().split("T")[0],
    hourOfDay: new Date().getHours(),
  });

  const [weatherSystem, setWeatherSystemState] = useState("diceTable");

  const handleWorldDataChange = (e) => {
    const { name, value } = e.target;
    setWorldData({
      ...worldData,
      [name]: value,
    });
  };

  const handleWorldSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleWeatherSystemSubmit = (e) => {
    e.preventDefault();

    // Save world settings
    try {
      const [year, month, day] = worldData.gameDate.split("-").map(Number);
      const dateTime = new Date(year, month - 1, day);
      dateTime.setHours(parseInt(worldData.hourOfDay, 10), 0, 0, 0);

      setWorldName(worldData.worldName);
      setGameTime(dateTime);
      setIsConfigured(true);

      // Save weather system preference
      setWeatherSystem(weatherSystem);

      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error setting up world:", error);
    }
  };

  // Generate hours for the select dropdown (1-12 AM/PM format)
  const hoursOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const ampm = i < 12 ? "AM" : "PM";
    hoursOptions.push(
      <option key={i} value={i}>
        {hour12} {ampm}
      </option>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">
            {step === 1
              ? "Welcome to WeatherMaster.io"
              : "Choose Weather Generation Method"}
          </h2>
        </div>

        {step === 1 ? (
          <form onSubmit={handleWorldSubmit} className="p-4">
            <p className="mb-4 text-gray-300">
              Let's set up your world to get started.
            </p>

            <div className="mb-4">
              <label htmlFor="worldName" className="block mb-2">
                World Name
              </label>
              <input
                type="text"
                id="worldName"
                name="worldName"
                value={worldData.worldName}
                onChange={handleWorldDataChange}
                className="w-full p-2 rounded bg-surface-light text-white border border-border"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="gameDate" className="block mb-2">
                  Game Date
                </label>
                <input
                  type="date"
                  id="gameDate"
                  name="gameDate"
                  value={worldData.gameDate}
                  onChange={handleWorldDataChange}
                  className="w-full p-2 rounded bg-surface-light text-white border border-border"
                  required
                />
                <div className="text-sm text-gray-400 mt-1">
                  The date in your game world
                </div>
              </div>
              <div>
                <label htmlFor="hourOfDay" className="block mb-2">
                  Hour of Day
                </label>
                <select
                  id="hourOfDay"
                  name="hourOfDay"
                  value={worldData.hourOfDay}
                  onChange={handleWorldDataChange}
                  className="w-full p-2 rounded bg-surface-light text-white border border-border"
                  required
                >
                  {hoursOptions}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border mt-6">
              <button type="submit" className="btn btn-primary">
                Continue
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleWeatherSystemSubmit} className="p-4">
            <p className="mb-4 text-gray-300">
              Choose your preferred method for generating weather.
            </p>

            <div className="space-y-4 mb-6">
              <div
                className={`p-4 rounded border cursor-pointer ${
                  weatherSystem === "diceTable"
                    ? "border-primary bg-surface-light"
                    : "border-border bg-surface"
                }`}
                onClick={() => setWeatherSystemState("diceTable")}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="diceTable"
                    name="weatherSystem"
                    value="diceTable"
                    checked={weatherSystem === "diceTable"}
                    onChange={() => setWeatherSystemState("diceTable")}
                    className="mr-3"
                  />
                  <label
                    htmlFor="diceTable"
                    className="font-semibold cursor-pointer"
                  >
                    Roll for Weather (Basic)
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-400 ml-6">
                  Uses classic dice tables for weather generation. Simpler,
                  faster, with a traditional RPG feel.
                </p>
              </div>

              <div
                className={`p-4 rounded border cursor-pointer ${
                  weatherSystem === "meteorological"
                    ? "border-primary bg-surface-light"
                    : "border-border bg-surface"
                }`}
                onClick={() => setWeatherSystemState("meteorological")}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="meteorological"
                    name="weatherSystem"
                    value="meteorological"
                    checked={weatherSystem === "meteorological"}
                    onChange={() => setWeatherSystemState("meteorological")}
                    className="mr-3"
                  />
                  <label
                    htmlFor="meteorological"
                    className="font-semibold cursor-pointer"
                  >
                    Meteorological Generation (Advanced)
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-400 ml-6">
                  Calculates realistic weather patterns based on physical
                  parameters. More detailed and realistic transitions.
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-400 mb-4">
              You can change this setting anytime in the app preferences.
            </div>

            <div className="flex justify-between gap-3 pt-3 border-t border-border mt-6">
              <button type="button" onClick={() => setStep(1)} className="btn">
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Get Started
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FirstTimeSetup;
