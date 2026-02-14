import express from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/parking-spot-db';
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost';

// --- Models ---
const ParkingSpotSchema = new mongoose.Schema({
  location: String,
  isOccupied: { type: Boolean, default: false },
  type: { type: String, enum: ['standard', 'disabled', 'ev'], default: 'standard' },
  pricePerHour: Number
});

const ParkingSpot = mongoose.model('ParkingSpot', ParkingSpotSchema);

// --- RabbitMQ Setup ---
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URI);
    const channel = await connection.createChannel();
    const exchange = 'parking_events';
    
    await channel.assertExchange(exchange, 'topic', { durable: false });
    
    console.log('Connected to RabbitMQ');

    // Subscribe to events (e.g., sensor updates) if needed
    // For now, this service might just emit updates or listen to sensor events to update status.
    // Let's listen to 'sensor.update'
    const q = await channel.assertQueue('', { exclusive: true });
    channel.bindQueue(q.queue, exchange, 'sensor.*');

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        console.log(`Received ${routingKey}:`, event);

        if (routingKey === 'sensor.occupied') {
             await ParkingSpot.findByIdAndUpdate(event.spotId, { isOccupied: true });
             console.log(`Spot ${event.spotId} marked occupied`);
        } else if (routingKey === 'sensor.freed') {
             await ParkingSpot.findByIdAndUpdate(event.spotId, { isOccupied: false });
             console.log(`Spot ${event.spotId} marked free`);
        }
        channel.ack(msg);
      }
    });

  } catch (error) {
    console.error('RabbitMQ connect error:', error);
    setTimeout(connectRabbitMQ, 5000); // Retry
  }
}


// --- Routes ---
app.get('/spots', async (req, res) => {
  const spots = await ParkingSpot.find();
  res.json(spots);
});

app.get('/spots/:id', async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id);
    if (!spot) return res.status(404).send('Spot not found');
    res.json(spot);
  } catch(e) {
    res.status(500).send(e);
  }
});

app.post('/spots', async (req, res) => {
  const spot = new ParkingSpot(req.body);
  await spot.save();
  res.json(spot);
});

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// --- Start ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Parking Spot Service running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connect error:', err));
