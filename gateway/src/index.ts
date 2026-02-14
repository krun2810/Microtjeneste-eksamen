import express from 'express';
import proxy from 'express-http-proxy';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;

const PARKING_SPOT_SERVICE_URL = process.env.PARKING_SPOT_SERVICE_URL || 'http://localhost:3001';
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || 'http://localhost:3002';
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3003';
const SENSOR_SERVICE_URL = process.env.SENSOR_SERVICE_URL || 'http://localhost:3004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

// Root route
app.get('/', (req, res) => {
  res.send('API Gateway is running');
});

// Proxy routes
app.use('/api/spots', proxy(PARKING_SPOT_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return '/spots' + req.url;
  }
}));

// Frontend route (optional proxy, or just CORS support for separate frontend)
// Since we have a dedicated frontend service on port 3000, we just need CORS (already enabled).

app.use('/api/reservations', proxy(RESERVATION_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return '/reservations' + req.url;
  }
}));

app.use('/api/bills', proxy(BILLING_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return '/bills' + req.url;
  }
}));

app.use('/api/sensor', proxy(SENSOR_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return '/events' + req.url; // Gateway /api/sensor/occupied -> Sensor Service /events/occupied
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
