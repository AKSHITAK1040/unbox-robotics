const axios = require('axios');

let rawBackendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

// If Render passes a naked service name (e.g. "unbox-backend-ucjg"), append .onrender.com
if (rawBackendUrl && !rawBackendUrl.includes('.') && !rawBackendUrl.includes('localhost') && !rawBackendUrl.includes(':')) {
  rawBackendUrl = `${rawBackendUrl}.onrender.com`;
}

if (!rawBackendUrl.startsWith('http://') && !rawBackendUrl.startsWith('https://')) {
  rawBackendUrl = `https://${rawBackendUrl}`;
}
const BACKEND_URL = rawBackendUrl;
const ENDPOINT = `${BACKEND_URL}/api/speed`;
const INTERVAL = 1000;

let currentSpeed = 45; // Start at 45 km/h

// Simulate realistic robot speed changes (smooth changes instead of random jumps)
function getNextSpeed() {
  // change speed by a small delta between -2 and +2
  const delta = (Math.random() * 4) - 2; 
  currentSpeed = currentSpeed + delta;

  // keep speed within reasonable bounds (0 to 120)
  if (currentSpeed < 0) currentSpeed = 0;
  if (currentSpeed > 120) currentSpeed = 120;

  // return rounded to 1 decimal place
  return Math.round(currentSpeed * 10) / 10;
}

async function sendSpeedData() {
  const speed = getNextSpeed();
  const payload = { speed };

  try {
    await axios.post(ENDPOINT, payload, { timeout: 2000 });
    console.log(`[Simulator] Sent speed: ${speed} km/h`);
  } catch (error) {
    if (error.response) {
      console.error(`[Simulator] Backend returned error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error(`[Simulator] Backend unavailable. Retrying... (${error.message})`);
    } else {
      console.error(`[Simulator] Error: ${error.message}`);
    }
  }
}

// Optional lightweight HTTP listener to satisfy cloud platform port checks (e.g., Render Web Service)
if (process.env.PORT) {
  const http = require('http');
  http.createServer((req, res) => res.end('Unbox Simulator Active')).listen(process.env.PORT, () => {
    console.log(`[Simulator] Health listener active on port ${process.env.PORT}`);
  });
}

function startSimulation() {
  console.log(`[Simulator] Starting simulation, sending data to ${ENDPOINT} every ${INTERVAL}ms`);
  
  // Initial wait to give backend time to start up and connect to DB
  setTimeout(() => {
    setInterval(sendSpeedData, INTERVAL);
  }, 2000);
}

startSimulation();

