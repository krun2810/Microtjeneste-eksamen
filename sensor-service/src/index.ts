import express from 'express';
import amqp from 'amqplib';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3004;
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost';

let channel: amqp.Channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URI);
    channel = await connection.createChannel();
    const exchange = 'parking_events';
    
    await channel.assertExchange(exchange, 'topic', { durable: false });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connect error:', error);
    setTimeout(connectRabbitMQ, 5000); // Retry
  }
}

// --- Routes ---
// Endpoint to simulate sensor detecting a car
app.post('/events/occupied', async (req, res) => {
  const { spotId } = req.body;
  if (!channel) return res.status(500).send('RabbitMQ not connected');
  
  const event = {
    spotId,
    timestamp: new Date()
  };
  
  channel.publish('parking_events', 'sensor.occupied', Buffer.from(JSON.stringify(event)));
  console.log(`Published sensor.occupied for spot ${spotId}`);
  res.send({ status: 'published', event });
});

// Endpoint to simulate sensor validating a spot is free
app.post('/events/freed', async (req, res) => {
  const { spotId } = req.body;
  if (!channel) return res.status(500).send('RabbitMQ not connected');
  
  const event = {
    spotId,
    timestamp: new Date()
  };
  
  channel.publish('parking_events', 'sensor.freed', Buffer.from(JSON.stringify(event)));
  console.log(`Published sensor.freed for spot ${spotId}`);
  res.send({ status: 'published', event });
});

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// --- Start ---
connectRabbitMQ();
app.listen(PORT, () => {
  console.log(`Sensor Service running on port ${PORT}`);
});
