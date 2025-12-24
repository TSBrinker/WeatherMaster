Pasted below is a small web-app that another, independent AI agent worked up for me. It contains all relevant calculations for daylight times, illumination, etc.

I have not set this as a code file as it is primarily for your review and not for actual running. This can be adjusted later if necessary. Without further ado-

--

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Circle Visualization Tool</title>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a2e;
            color: #eee;
            overflow: hidden;
        }
        #container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        #controls {
            width: 100%;
            background: #16213e;
            padding: 20px;
            overflow-y: auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            max-height: 40vh;
        }
        #canvas-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0a0a14;
            overflow: hidden;
            position: relative;
        }
        canvas {
            border: 2px solid #3282b8;
            border-radius: 8px;
            background: #050510;
            max-width: 100%;
            max-height: 100%;
            touch-action: none;
        }
        @media (min-width: 768px) {
            #container {
                flex-direction: row;
            }
            #controls {
                width: 320px;
                max-height: 100vh;
                box-shadow: 2px 0 10px rgba(0,0,0,0.3);
            }
        }
        h1 {
            margin: 0 0 5px 0;
            font-size: 20px;
            color: #0f4c75;
        }
        h2 {
            margin: 15px 0 10px 0;
            font-size: 16px;
            color: #3282b8;
            border-bottom: 2px solid #3282b8;
            padding-bottom: 5px;
        }
        .control-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-size: 13px;
            color: #bbe1fa;
        }
        input[type="range"] {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin-bottom: 5px;
        }
        input[type="number"] {
            width: 100%;
            padding: 8px;
            background: #0f3460;
            border: 1px solid #3282b8;
            color: #eee;
            border-radius: 4px;
            font-size: 14px;
        }
        .value-display {
            display: inline-block;
            background: #0f3460;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            color: #bbe1fa;
            margin-top: 5px;
        }
        .info-box {
            background: #0f3460;
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            border-left: 4px solid #3282b8;
        }
        .info-box h3 {
            margin: 0 0 8px 0;
            color: #bbe1fa;
            font-size: 14px;
        }
        .info-item {
            margin: 6px 0;
            font-size: 12px;
        }
        button {
            width: 100%;
            padding: 10px;
            background: #3282b8;
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        }
        button:hover {
            background: #0f4c75;
        }
        .tip {
            font-size: 12px;
            color: #888;
            font-style: italic;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="controls">
            <h1>🌍 Flat World Visualizer</h1>
            <p style="font-size: 13px; color: #aaa; margin-top: 5px;">Experience day and night on a flat disc</p>

            <div style="margin: 15px 0;">
                <button id="viewToggle" onclick="toggleView()" style="width: 100%; padding: 12px; font-size: 16px; background: #0f4c75; margin: 0;">
                    👁️ Switch to Surface View
                </button>
            </div>

            <h2>🌍 Season</h2>
            <div class="control-group">
                <div style="display: flex; gap: 5px;">
                    <button onclick="setSeason(8000)" style="flex: 1; padding: 8px; margin: 0;">☀️ Summer</button>
                    <button onclick="setSeason(9500)" style="flex: 1; padding: 8px; margin: 0;">🍂 Equinox</button>
                    <button onclick="setSeason(11000)" style="flex: 1; padding: 8px; margin: 0;">❄️ Winter</button>
                </div>
            </div>

            <h2>📍 Your Location</h2>
            <div class="control-group">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;">
                    <button onclick="setLocation(0)" style="padding: 8px; margin: 0;">Center</button>
                    <button onclick="setLocation(3000)" style="padding: 8px; margin: 0;">Temperate</button>
                    <button onclick="setLocation(5000)" style="padding: 8px; margin: 0;">Tropical</button>
                    <button onclick="setLocation(7000)" style="padding: 8px; margin: 0;">Rim</button>
                </div>
                <label>Distance from Center (miles)</label>
                <input type="range" id="pointDistance" min="0" max="7000" value="3500" step="100" style="width: 100%; max-width: 100%; box-sizing: border-box;">
                <input type="number" id="pointDistanceNum" min="0" max="20000" value="3500" step="1">
                <span class="value-display" id="pointDistanceDisplay">3500 miles</span>
                <div class="tip">Viewing position faces south</div>
            </div>

            <h2 id="zoomHeader">🔍 Zoom</h2>
            <div class="control-group" id="zoomControls">
                <label>Zoom Level</label>
                <input type="range" id="zoomSlider" min="1" max="20" value="20" step="0.1">
                <input type="number" id="zoomSliderNum" min="0.05" max="20" value="20" step="0.1">
                <span class="value-display" id="zoomSliderDisplay">20.0x</span>
                <div class="tip">Zoom in on the tracked point</div>
            </div>

            <h2 id="animationHeader">⏱️ Animation Speed</h2>
            <div class="control-group" id="animationControls">
                <div style="display: flex; gap: 5px;">
                    <button onclick="setSpeed(3600)" style="flex: 1; padding: 8px; margin: 0;">Slow (1h/s)</button>
                    <button onclick="setSpeed(7200)" style="flex: 1; padding: 8px; margin: 0;">Medium (2h/s)</button>
                    <button onclick="setSpeed(14400)" style="flex: 1; padding: 8px; margin: 0;">Fast (4h/s)</button>
                </div>
            </div>

            <button onclick="resetTime()">Reset to Midnight</button>
            <button onclick="resetZoom()">Reset View</button>

            <div class="info-box">
                <h3>🔆 Point Illumination</h3>
                <div class="info-item">Status: <strong id="pointStatus">Outside illumination</strong></div>
                <div class="info-item">Enters at: <strong id="enterTime">--:--:--</strong></div>
                <div class="info-item">Exits at: <strong id="exitTime">--:--:--</strong></div>
                <div class="info-item">Duration: <strong id="illumDuration">-- hours -- min</strong></div>
            </div>

            <div class="info-box">
                <h3>🕐 Current Time</h3>
                <div class="info-item">Time: <strong id="currentTime">00:00:00</strong></div>
                <div class="info-item">Day progress: <strong id="dayProgress">0%</strong></div>
            </div>
        </div>
        <div id="canvas-container">
            <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 10;">
                <button id="playPause" onclick="toggleAnimation()" style="width: auto; padding: 8px 20px; font-size: 16px;">▶️ Play Animation</button>
            </div>
            <canvas id="canvas"></canvas>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        let zoom = 20;
        let offsetX = 0;
        let offsetY = 0;
        let currentView = 'overhead'; // 'overhead' or 'surface'
        let timeSpeed = 14400; // Animation speed: seconds per real second
        let sunOrbitDistance = 8000; // Distance of sun's orbit, controlled by season buttons
        
        // Animation variables
        let currentTimeSeconds = 0; // 0-86400 (24 hours in seconds)
        let isAnimating = false;
        let lastFrameTime = Date.now();
        
        // Get all controls
        const controls = {
            pointDistance: { slider: document.getElementById('pointDistance'), number: document.getElementById('pointDistanceNum'), display: document.getElementById('pointDistanceDisplay') },
            zoomSlider: { slider: document.getElementById('zoomSlider'), number: document.getElementById('zoomSliderNum'), display: document.getElementById('zoomSliderDisplay') }
        };

        // Sync slider and number input
        function syncControl(name) {
            const ctrl = controls[name];
            ctrl.slider.addEventListener('input', (e) => {
                ctrl.number.value = e.target.value;
                if (name === 'zoomSlider') {
                    zoom = parseFloat(e.target.value);
                }
                update();
            });
            ctrl.number.addEventListener('input', (e) => {
                ctrl.slider.value = e.target.value;
                if (name === 'zoomSlider') {
                    zoom = parseFloat(e.target.value);
                }
                update();
            });
        }

        syncControl('pointDistance');
        syncControl('zoomSlider');

        function getValues() {
            return {
                discRadius: 7000, // Fixed
                sunRadius: 10000, // Fixed
                distance: sunOrbitDistance,
                pointDistance: parseFloat(controls.pointDistance.number.value),
                timeSpeed: timeSpeed
            };
        }

        function updateControlVisibility() {
            const zoomControls = document.getElementById('zoomControls');
            const zoomHeader = document.getElementById('zoomHeader');
            const animationControls = document.getElementById('animationControls');
            const animationHeader = document.getElementById('animationHeader');
            
            if (currentView === 'overhead') {
                // Show zoom, hide animation speed
                zoomControls.style.display = 'block';
                zoomHeader.style.display = 'block';
                animationControls.style.display = 'none';
                animationHeader.style.display = 'none';
                // Reset to fast speed for overhead view
                timeSpeed = 14400;
            } else {
                // Hide zoom, show animation speed
                zoomControls.style.display = 'none';
                zoomHeader.style.display = 'none';
                animationControls.style.display = 'block';
                animationHeader.style.display = 'block';
            }
        }

        function draw() {
            if (currentView === 'overhead') {
                drawOverhead();
            } else {
                drawSurface();
            }
        }

        function drawOverhead() {
            const { discRadius, sunRadius, distance, pointDistance } = getValues();
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Calculate scale to fit both circles
            const maxExtent = Math.max(
                discRadius * 2,
                distance * 2 + sunRadius * 2
            );
            const padding = 50;
            const scale = Math.min(canvas.width, canvas.height) / (maxExtent * 2 + padding) * zoom;
            
            // Auto-center on tracked point when zoomed in
            let centerX, centerY;
            if (zoom > 3) {
                // Calculate point position in world space
                const pointAngle = Math.PI / 2;
                const pointWorldX = Math.cos(pointAngle) * pointDistance;
                const pointWorldY = Math.sin(pointAngle) * pointDistance;
                
                // Center on point
                centerX = canvas.width / 2 - pointWorldX * scale + offsetX;
                centerY = canvas.height / 2 - pointWorldY * scale + offsetY;
            } else {
                // Normal centering on disc center
                centerX = canvas.width / 2 + offsetX;
                centerY = canvas.height / 2 + offsetY;
            }
            
            // Draw grid
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            for (let i = -10; i <= 10; i++) {
                const pos = i * 100 * scale;
                ctx.beginPath();
                ctx.moveTo(centerX + pos, 0);
                ctx.lineTo(centerX + pos, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, centerY + pos);
                ctx.lineTo(canvas.width, centerY + pos);
                ctx.stroke();
            }
            
            // Draw center crosshair for disc
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 20, centerY);
            ctx.lineTo(centerX + 20, centerY);
            ctx.moveTo(centerX, centerY - 20);
            ctx.lineTo(centerX, centerY + 20);
            ctx.stroke();
            
            // Draw orbit path (dashed circle)
            if (distance > 0) {
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(centerX, centerY, distance * scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Draw disc (blue)
            ctx.beginPath();
            ctx.arc(centerX, centerY, discRadius * scale, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(50, 130, 184, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(50, 130, 184, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw central mountain (100 mile diameter = 50 mile radius)
            const MOUNTAIN_RADIUS = 50;
            ctx.beginPath();
            ctx.arc(centerX, centerY, MOUNTAIN_RADIUS * scale, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.7)'; // Gray mountain
            ctx.fill();
            ctx.strokeStyle = 'rgba(80, 80, 80, 1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Calculate sun position based on time (revolves around disc in 24 hours)
            // 0:00 = top (north), 6:00 = right (east), 12:00 = bottom (south), 18:00 = left (west)
            const angle = (currentTimeSeconds / 86400) * Math.PI * 2 - Math.PI / 2; // Start at top (midnight)
            const sunX = centerX + Math.cos(angle) * distance * scale;
            const sunY = centerY + Math.sin(angle) * distance * scale;
            
            // Draw line from center to sun
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(sunX, sunY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw sun illumination (yellow)
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius * scale, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw twilight ring (11000 mile radius)
            const TWILIGHT_RADIUS = 11000;
            ctx.beginPath();
            ctx.arc(sunX, sunY, TWILIGHT_RADIUS * scale, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 165, 0, 0.15)'; // Orange tint
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw sun center
            ctx.beginPath();
            ctx.arc(sunX, sunY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            
            // Draw tracked point at 180° (south) from disc center
            const pointAngle = Math.PI / 2; // 180° in radians (pointing down/south)
            const pointX = centerX + Math.cos(pointAngle) * pointDistance * scale;
            const pointY = centerY + Math.sin(pointAngle) * pointDistance * scale;
            
            // Check if point is currently illuminated
            const distToSun = Math.sqrt(Math.pow(pointX - sunX, 2) + Math.pow(pointY - sunY, 2));
            let isIlluminated = distToSun <= sunRadius * scale;
            
            // TODO: Shadow calculation temporarily disabled
            
            // Draw line from center to point
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(pointX, pointY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw the tracked point (smaller size, no emoji)
            ctx.beginPath();
            ctx.arc(pointX, pointY, 5, 0, Math.PI * 2);
            ctx.fillStyle = isIlluminated ? '#ff4444' : '#ff8888';
            ctx.fill();
            ctx.strokeStyle = isIlluminated ? '#ff0000' : '#ff4444';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        function drawSurface() {
            const { discRadius, sunRadius, distance, pointDistance } = getValues();
            
            // Set canvas to fill container
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            
            // Calculate sun position
            const angle = (currentTimeSeconds / 86400) * Math.PI * 2 - Math.PI / 2;
            const sunX_world = Math.cos(angle) * distance;
            const sunY_world = Math.sin(angle) * distance;
            
            // Viewer is at pointDistance south from center
            const viewerX = 0;
            const viewerY = pointDistance;
            
            // Calculate distance from viewer to sun
            const distToSun = Math.sqrt(Math.pow(sunX_world - viewerX, 2) + Math.pow(sunY_world - viewerY, 2));
            
            // Calculate sun's position relative to viewer (facing south)
            const relativeX = sunX_world - viewerX;
            const relativeY = sunY_world - viewerY;
            
            // Calculate angle from viewer's perspective (reversed for east-to-west)
            const viewAngle = Math.atan2(-relativeX, relativeY);
            
            // Determine sky lighting state
            const TWILIGHT_RADIUS = 11000;
            let skyState;
            if (distToSun <= sunRadius) {
                skyState = 'day';
            } else if (distToSun <= TWILIGHT_RADIUS) {
                skyState = 'twilight';
            } else {
                skyState = 'night';
            }
            
            // Sky colors
            let skyColor;
            if (skyState === 'day') {
                skyColor = { top: [135, 206, 235], bottom: [180, 220, 255] };
            } else if (skyState === 'twilight') {
                const twilightFactor = (distToSun - sunRadius) / (TWILIGHT_RADIUS - sunRadius);
                const dayTop = [135, 206, 235];
                const nightTop = [25, 25, 60];
                const dayBottom = [180, 220, 255];
                const nightBottom = [40, 40, 80];
                
                skyColor = {
                    top: dayTop.map((v, i) => Math.round(v + (nightTop[i] - v) * twilightFactor)),
                    bottom: dayBottom.map((v, i) => Math.round(v + (nightBottom[i] - v) * twilightFactor))
                };
            } else {
                skyColor = { top: [25, 25, 60], bottom: [40, 40, 80] };
            }
            
            // Draw sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
            gradient.addColorStop(0, `rgb(${skyColor.top.join(',')})`);
            gradient.addColorStop(1, `rgb(${skyColor.bottom.join(',')})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
            
            // Draw horizon/ground
            ctx.fillStyle = '#2a4a2a';
            ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
            
            // Draw horizon line
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height * 0.7);
            ctx.lineTo(canvas.width, canvas.height * 0.7);
            ctx.stroke();
            
            // Draw sun if visible
            const FOV = Math.PI / 2;
            if (Math.abs(viewAngle) < FOV && relativeY > 0) {
                const screenX = canvas.width / 2 + (viewAngle / FOV) * (canvas.width / 2);
                const horizonY = canvas.height * 0.7;
                const screenY = horizonY - (30 / 45) * horizonY * 0.8;
                
                // Sun size based on distance
                const baseSunSize = 40;
                const distanceFactor = Math.max(0.3, 1 - (distToSun / 25000));
                const sunSize = baseSunSize * distanceFactor;
                
                // Draw sun glow
                const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, sunSize * 2);
                glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
                glowGradient.addColorStop(0.5, 'rgba(255, 220, 100, 0.3)');
                glowGradient.addColorStop(1, 'rgba(255, 220, 100, 0)');
                ctx.fillStyle = glowGradient;
                ctx.fillRect(screenX - sunSize * 2, screenY - sunSize * 2, sunSize * 4, sunSize * 4);
                
                // Draw sun
                ctx.beginPath();
                ctx.arc(screenX, screenY, sunSize, 0, Math.PI * 2);
                ctx.fillStyle = '#ffff00';
                ctx.fill();
            }
        }

        function toggleView() {
            currentView = currentView === 'overhead' ? 'surface' : 'overhead';
            const btn = document.getElementById('viewToggle');
            if (currentView === 'overhead') {
                btn.textContent = '👁️ Switch to Surface View';
            } else {
                btn.textContent = '🗺️ Switch to Overhead View';
            }
            updateControlVisibility();
            update();
        }

        function calculateIlluminationTimes() {
            const { sunRadius, distance, pointDistance } = getValues();
            
            // Point is at 180° (south)
            const pointAngle = Math.PI / 2;
            const pointX = Math.cos(pointAngle) * pointDistance;
            const pointY = Math.sin(pointAngle) * pointDistance;
            
            // Sun orbits around origin
            // We need to find when the distance from sun to point equals sunRadius
            // Sun position at time t: (cos(angle_t) * distance, sin(angle_t) * distance)
            // where angle_t = (t / 86400) * 2π - π/2
            
            let enterTime = null;
            let exitTime = null;
            let currentlyInside = false;
            
            // Sample every second of the day to find transitions
            for (let t = 0; t < 86400; t++) {
                const angle = (t / 86400) * Math.PI * 2 - Math.PI / 2;
                const sunX = Math.cos(angle) * distance;
                const sunY = Math.sin(angle) * distance;
                
                const distToSun = Math.sqrt(Math.pow(pointX - sunX, 2) + Math.pow(pointY - sunY, 2));
                const isInside = distToSun <= sunRadius;
                
                if (isInside && !currentlyInside && enterTime === null) {
                    enterTime = t;
                    currentlyInside = true;
                } else if (!isInside && currentlyInside) {
                    exitTime = t;
                    currentlyInside = false;
                    break; // Found both times
                }
            }
            
            // Check current status
            const angle = (currentTimeSeconds / 86400) * Math.PI * 2 - Math.PI / 2;
            const sunX = Math.cos(angle) * distance;
            const sunY = Math.sin(angle) * distance;
            const distToSun = Math.sqrt(Math.pow(pointX - sunX, 2) + Math.pow(pointY - sunY, 2));
            const isCurrentlyIlluminated = distToSun <= sunRadius;
            
            return { enterTime, exitTime, isCurrentlyIlluminated, distToSun };
        }

        function formatTime(seconds) {
            if (seconds === null) return '--:--:--';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        function updateStats() {
            const { discRadius, sunRadius, distance, pointDistance, timeSpeed } = getValues();
            
            controls.pointDistance.display.textContent = `${Math.round(pointDistance)} miles`;
            controls.zoomSlider.display.textContent = `${zoom.toFixed(1)}x`;
            
            // Update time display
            const hours = Math.floor(currentTimeSeconds / 3600);
            const minutes = Math.floor((currentTimeSeconds % 3600) / 60);
            const seconds = Math.floor(currentTimeSeconds % 60);
            document.getElementById('currentTime').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            document.getElementById('dayProgress').textContent = 
                `${((currentTimeSeconds / 86400) * 100).toFixed(1)}%`;
            
            // Calculate and display illumination times for the tracked point
            const illumTimes = calculateIlluminationTimes();
            
            // Determine illumination state (Day/Twilight/Night)
            const TWILIGHT_RADIUS = 11000;
            let statusText;
            if (illumTimes.distToSun <= sunRadius) {
                statusText = '☀️ Day';
            } else if (illumTimes.distToSun <= TWILIGHT_RADIUS) {
                statusText = '🌅 Twilight';
            } else {
                statusText = '🌑 Night';
            }
            document.getElementById('pointStatus').textContent = statusText;
            document.getElementById('enterTime').textContent = formatTime(illumTimes.enterTime);
            document.getElementById('exitTime').textContent = formatTime(illumTimes.exitTime);
            
            if (illumTimes.enterTime !== null && illumTimes.exitTime !== null) {
                const durationSeconds = illumTimes.exitTime - illumTimes.enterTime;
                const durationHours = Math.floor(durationSeconds / 3600);
                const durationMinutes = Math.floor((durationSeconds % 3600) / 60);
                document.getElementById('illumDuration').textContent = 
                    `${durationHours} hours ${durationMinutes} min`;
            } else {
                document.getElementById('illumDuration').textContent = 'Never illuminated';
            }
        }

        function update() {
            draw();
            updateStats();
        }

        function resetZoom() {
            zoom = 1;
            offsetX = 0;
            offsetY = 0;
            update();
        }

        function setLocation(distance) {
            controls.pointDistance.number.value = distance;
            controls.pointDistance.slider.value = distance;
            update();
        }

        function setSeason(distance) {
            sunOrbitDistance = distance;
            update();
        }

        function setSpeed(speed) {
            timeSpeed = speed;
            update();
        }

        // Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoom *= delta;
            zoom = Math.max(0.05, Math.min(20, zoom)); // Allow zoom from 0.05x to 20x
            update();
        });

        // Click and drag to pan
        let isDragging = false;
        let lastX, lastY;

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                offsetX += e.clientX - lastX;
                offsetY += e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                update();
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
                e.preventDefault();
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                offsetX += e.touches[0].clientX - lastX;
                offsetY += e.touches[0].clientY - lastY;
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
                update();
                e.preventDefault();
            }
        });

        canvas.addEventListener('touchend', () => {
            isDragging = false;
        });

        function toggleAnimation() {
            isAnimating = !isAnimating;
            const btn = document.getElementById('playPause');
            btn.textContent = isAnimating ? '⏸️ Pause' : '▶️ Play Animation';
            if (isAnimating) {
                lastFrameTime = Date.now();
                animationLoop();
            }
        }

        function resetTime() {
            currentTimeSeconds = 0;
            update();
        }

        function animationLoop() {
            if (!isAnimating) return;
            
            const now = Date.now();
            const deltaTime = (now - lastFrameTime) / 1000; // real seconds elapsed
            lastFrameTime = now;
            
            const { timeSpeed } = getValues();
            currentTimeSeconds += deltaTime * timeSpeed;
            
            // Wrap around at 24 hours
            if (currentTimeSeconds >= 86400) {
                currentTimeSeconds -= 86400;
            }
            
            update();
            requestAnimationFrame(animationLoop);
        }

        // Resize canvas to fit container
        function resizeCanvas() {
            const container = document.getElementById('canvas-container');
            const size = Math.min(container.clientWidth - 20, container.clientHeight - 20, 900);
            canvas.width = size;
            canvas.height = size;
            update();
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Initial setup
        updateControlVisibility();
        update();
    </script>
</body>
</html>