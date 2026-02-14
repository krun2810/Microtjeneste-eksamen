import express from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/billing-db';
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost';

// --- Models ---
const BillSchema = new mongoose.Schema({
  reservationId: String,
  amount: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Bill = mongoose.model('Bill', BillSchema);

// --- RabbitMQ Setup ---
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URI);
    const channel = await connection.createChannel();
    const exchange = 'parking_events';
    
    await channel.assertExchange(exchange, 'topic', { durable: false });
    const q = await channel.assertQueue('', { exclusive: true });
    
    // Listen for reservation creation to init billing? Or session ended?
    // Let's listen to reservation.created just to demonstrate
    channel.bindQueue(q.queue, exchange, 'reservation.created');
    
    console.log('Connected to RabbitMQ');

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        console.log('Received event:', event);

        // Create a dummy bill
        const bill = new Bill({
          reservationId: event.reservationId,
          amount: 50.0 // Flat rate for example
        });
        await bill.save();
        console.log('Bill created for reservation:', event.reservationId);
        
        channel.ack(msg);
      }
    });

  } catch (error) {
    console.error('RabbitMQ connect error:', error);
    setTimeout(connectRabbitMQ, 5000); // Retry
  }
}

// --- Routes ---
app.get('/bills', async (req, res) => {
  const bills = await Bill.find();
  res.json(bills);
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
      console.log(`Billing Service running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connect error:', err));
