require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Send SMS endpoint
app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and message are required' 
      });
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_NUMBER,
      to: `+${to}` // Ensure the number has a + prefix
    });

    res.json({ 
      success: true, 
      message: 'SMS sent successfully',
      sid: result.sid
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send SMS' 
    });
  }
});

// Send WhatsApp message endpoint
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and message are required' 
      });
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUM,
      to: `whatsapp:${to.replace(/^\+/, '')}` // Ensure proper WhatsApp format
    });

    res.json({ 
      success: true, 
      message: 'WhatsApp message sent successfully',
      sid: result.sid
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something broke!',
    details: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`CORS enabled for: ${process.env.CORS_ORIGIN || '*'}`);
});

module.exports = app;
