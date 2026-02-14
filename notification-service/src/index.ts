import express from 'express';
import amqp from 'amqplib';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3005;
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost';

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URI);
    const channel = await connection.createChannel();
    const exchange = 'parking_events';
    
    await channel.assertExchange(exchange, 'topic', { durable: false });
    const q = await channel.assertQueue('', { exclusive: true });
    
    // Listen to ALL events
    channel.bindQueue(q.queue, exchange, '#'); 
    
    console.log('Connected to RabbitMQ, listenning to #');

    channel.consume(q.queue, (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        console.log(`[Notification] Received event: ${routingKey}`, event);
        // Simulate sending email/SMS
        console.log(`[Notification] Sending alert to user...`);
        
        channel.ack(msg);
      }
    });

  } catch (error) {
    console.error('RabbitMQ connect error:', error);
    setTimeout(connectRabbitMQ, 5000); // Retry
  }
}

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// --- Start ---
connectRabbitMQ();
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
