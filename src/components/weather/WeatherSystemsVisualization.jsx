// src/components/weather/WeatherSystemsVisualization.jsx
import React, { useEffect, useRef } from "react";

/**
 * Component for visualizing weather systems (pressure systems and fronts)
 * in the meteorological weather system
 */
const WeatherSystemsVisualization = ({
  weatherSystems = [],
  width = 300,
  height = 200,
}) => {
  const canvasRef = useRef(null);

  // Colors for different system types
  const systemColors = {
    "high-pressure": "#4dabf7", // Light blue
    "low-pressure": "#ff6b6b", // Red
    "cold-front": "#748ffc", // Blue-purple
    "warm-front": "#f76707", // Orange
  };

  // Icons for different system types
  const systemIcons = {
    "high-pressure": "H",
    "low-pressure": "L",
    "cold-front": "▲", // Triangles for fronts
    "warm-front": "●",
  };

  // Draw weather systems on canvas
  useEffect(() => {
    if (!canvasRef.current || !weatherSystems || weatherSystems.length === 0)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw region background
    ctx.fillStyle = "#111827"; // Dark background
    ctx.fillRect(0, 0, width, height);

    // Draw border around region
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Draw compass rose
    drawCompassRose(ctx, 30, 30, 20);

    // Draw systems
    weatherSystems.forEach((system) => {
      // Calculate position on the canvas based on system.position (0-1)
      const x = system.position * width;
      const y =
        height / 2 +
        (system.type === "high-pressure" || system.type === "low-pressure"
          ? Math.random() * 60 - 30 // Scatter pressure systems vertically
          : 0); // Fronts go straight across

      // Draw based on system type
      if (system.type === "high-pressure" || system.type === "low-pressure") {
        drawPressureSystem(ctx, x, y, system);
      } else if (system.type === "cold-front" || system.type === "warm-front") {
        drawFront(ctx, x, y, system);
      }
    });

    // Draw legend
    drawLegend(ctx, width - 100, height - 80);
  }, [weatherSystems, width, height]);

  // Draw a pressure system (high or low)
  const drawPressureSystem = (ctx, x, y, system) => {
    const radius = 15 + (system.intensity || 0.5) * 10; // Size based on intensity, default to 0.5 if missing

    // Draw system circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `${systemColors[system.type]}33`; // Semi-transparent fill
    ctx.fill();
    ctx.strokeStyle = systemColors[system.type];
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw circulation arrows (clockwise for high, counter for low)
    const isHigh = system.type === "high-pressure";
    drawCirculationArrows(ctx, x, y, radius + 5, isHigh);

    // Draw H or L label
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = systemColors[system.type];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(systemIcons[system.type], x, y);

    // Draw intensity as percentage
    ctx.font = "10px sans-serif";
    ctx.fillText(
      `${Math.round((system.intensity || 0.5) * 100)}%`,
      x,
      y + radius + 12
    );
  };

  // Draw circulation arrows around pressure systems
  const drawCirculationArrows = (ctx, x, y, radius, isClockwise) => {
    const arrowCount = 8;
    const arrowSize = 5;

    for (let i = 0; i < arrowCount; i++) {
      const angle = (i / arrowCount) * Math.PI * 2;
      const arrowX = x + Math.cos(angle) * radius;
      const arrowY = y + Math.sin(angle) * radius;

      // Calculate arrow direction
      const dirAngle = isClockwise
        ? angle + Math.PI / 2 // Clockwise (high pressure)
        : angle - Math.PI / 2; // Counter-clockwise (low pressure)

      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX + Math.cos(dirAngle) * arrowSize,
        arrowY + Math.sin(dirAngle) * arrowSize
      );
      ctx.strokeStyle =
        systemColors[isClockwise ? "high-pressure" : "low-pressure"];
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // Draw a weather front
  const drawFront = (ctx, x, y, system) => {
    const isCold = system.type === "cold-front";
    const color = systemColors[system.type];
    const frontWidth = Math.min(width * 0.2, 50); // Width of the front

    // Draw front line
    ctx.beginPath();
    ctx.moveTo(x - frontWidth / 2, y);
    ctx.lineTo(x + frontWidth / 2, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw front symbols
    const symbolCount = 4;
    const symbolSpacing = frontWidth / symbolCount;

    for (let i = 0; i < symbolCount; i++) {
      const symbolX =
        x - frontWidth / 2 + i * symbolSpacing + symbolSpacing / 2;

      if (isCold) {
        // Cold front triangles
        drawTriangle(ctx, symbolX, y, color);
      } else {
        // Warm front semicircles
        drawSemicircle(ctx, symbolX, y, color);
      }
    }

    // Draw intensity meter
    const intensityHeight = (system.intensity || 0.5) * 15;
    ctx.fillStyle = `${color}88`;
    ctx.fillRect(
      x - frontWidth / 2 - 10,
      y - intensityHeight / 2,
      5,
      intensityHeight
    );
  };

  // Draw a triangle for cold fronts
  const drawTriangle = (ctx, x, y, color) => {
    const size = 8;

    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y + size / 2);
    ctx.lineTo(x - size, y + size / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Draw a semicircle for warm fronts
  const drawSemicircle = (ctx, x, y, color) => {
    const radius = 6;

    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI, 0, false);
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Draw compass rose
  const drawCompassRose = (ctx, x, y, radius) => {
    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#1f2937";
    ctx.fill();
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw cardinal directions
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#d1d5db";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // North
    ctx.fillText("N", x, y - radius - 5);
    // South
    ctx.fillText("S", x, y + radius + 5);
    // East
    ctx.fillText("E", x + radius + 5, y);
    // West
    ctx.fillText("W", x - radius - 5, y);

    // Draw crosshairs
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // Draw legend
  const drawLegend = (ctx, x, y) => {
    const entryHeight = 18;
    const iconWidth = 20;
    const padding = 5;

    // Background
    ctx.fillStyle = "#1f293780";
    ctx.fillRect(x - padding, y - padding, 90 + padding * 2, 80 + padding * 2);
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - padding,
      y - padding,
      90 + padding * 2,
      80 + padding * 2
    );

    // Title
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#d1d5db";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Weather Systems", x, y);

    y += 15; // Space after title

    // High pressure
    drawLegendEntry(ctx, x, y, "high-pressure", "High Pressure");
    y += entryHeight;

    // Low pressure
    drawLegendEntry(ctx, x, y, "low-pressure", "Low Pressure");
    y += entryHeight;

    // Cold front
    drawLegendEntry(ctx, x, y, "cold-front", "Cold Front");
    y += entryHeight;

    // Warm front
    drawLegendEntry(ctx, x, y, "warm-front", "Warm Front");
  };

  // Draw a legend entry
  const drawLegendEntry = (ctx, x, y, type, label) => {
    // Draw icon
    if (type === "high-pressure" || type === "low-pressure") {
      ctx.beginPath();
      ctx.arc(x + 10, y + 5, 7, 0, Math.PI * 2);
      ctx.fillStyle = `${systemColors[type]}33`;
      ctx.fill();
      ctx.strokeStyle = systemColors[type];
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw H or L
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = systemColors[type];
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(systemIcons[type], x + 10, y + 5);
    } else if (type === "cold-front") {
      drawTriangle(ctx, x + 10, y + 5, systemColors[type]);
    } else if (type === "warm-front") {
      drawSemicircle(ctx, x + 10, y + 5, systemColors[type]);
    }

    // Draw label
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#d1d5db";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + 25, y + 5);
  };

  // No systems to display
  if (!weatherSystems || weatherSystems.length === 0) {
    return (
      <div className="no-systems-container p-4 bg-surface rounded text-center">
        <p className="text-gray-400">No active weather systems</p>
      </div>
    );
  }

  return (
    <div className="weather-systems-container">
      <h3 className="text-lg font-semibold mb-2">Weather Systems</h3>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="weather-systems-canvas rounded bg-surface"
      />
      <div className="text-xs text-gray-400 mt-2">
        <p>Showing {weatherSystems.length} active weather systems</p>
      </div>
    </div>
  );
};

export default WeatherSystemsVisualization;
