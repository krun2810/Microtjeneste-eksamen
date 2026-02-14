import express from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/reservation-db';
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost';
const PARKING_SPOT_SERVICE_URL = process.env.PARKING_SPOT_SERVICE_URL || 'http://localhost:3001';

// --- Models ---
const ReservationSchema = new mongoose.Schema({
  spotId: String,
  userId: String,
  startTime: Date,
  endTime: Date,
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
});

const Reservation = mongoose.model('Reservation', ReservationSchema);

// --- RabbitMQ Setup ---
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
app.post('/reservations', async (req, res) => {
  const { spotId, userId, startTime, endTime } = req.body;

  try {
    // Sync check availability
    const response = await axios.get(`${PARKING_SPOT_SERVICE_URL}/spots/${spotId}`);
    if (!response.data || response.data.isOccupied) {
      return res.status(400).send('Spot is not available');
    }

    const reservation = new Reservation({ spotId, userId, startTime, endTime });
    await reservation.save();

    // Async Publish Event
    if (channel) {
      const event = {
        reservationId: reservation._id,
        spotId,
        userId,
        startTime,
        endTime
      };
      channel.publish('parking_events', 'reservation.created', Buffer.from(JSON.stringify(event)));
      console.log('Published event: reservation.created');
    }

    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating reservation');
  }
});

app.get('/reservations', async (req, res) => {
  const reservations = await Reservation.find();
  res.json(reservations);
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
      console.log(`Reservation Service running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connect error:', err));
