const express = require('express');
const axios = require('axios');
const { Server } = require('socket.io');
const { createServer } = require('http');
const cors = require('cors');

class WhatsAppWebhookServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.config = {
      accessToken: process.env.WHATSAPP_TOKEN || '',
      phoneNumberId: process.env.PHONE_NUMBER_ID || '',
      verifyToken: process.env.VERIFY_TOKEN || '123456',
      webhookUrl: process.env.WEBHOOK_URL || '',
      port: process.env.WEBHOOK_PORT || 3001
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        config: {
          hasAccessToken: !!this.config.accessToken,
          hasPhoneNumberId: !!this.config.phoneNumberId,
          verifyToken: this.config.verifyToken,
          webhookUrl: this.config.webhookUrl
        }
      });
    });

    // Configuration endpoint
    this.app.get('/config', (req, res) => {
      res.json({
        config: {
          hasAccessToken: !!this.config.accessToken,
          phoneNumberId: this.config.phoneNumberId,
          verifyToken: this.config.verifyToken,
          webhookUrl: this.config.webhookUrl
        },
        hasConfig: !!(this.config.accessToken && this.config.phoneNumberId)
      });
    });

    this.app.post('/config', (req, res) => {
      try {
        const { accessToken, phoneNumberId, verifyToken, webhookUrl } = req.body;
        
        if (!accessToken || !phoneNumberId || !verifyToken || !webhookUrl) {
          return res.status(400).json({
            error: 'Missing required configuration fields'
          });
        }

        this.config = {
          accessToken,
          phoneNumberId,
          verifyToken,
          webhookUrl
        };

        console.log('Configuration updated:', {
          accessToken: accessToken.substring(0, 10) + '...',
          phoneNumberId,
          verifyToken,
          webhookUrl
        });

        res.json({
          message: 'Configuration updated successfully',
          config: {
            accessToken: accessToken.substring(0, 10) + '...',
            phoneNumberId,
            verifyToken,
            webhookUrl
          }
        });
      } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({
          error: 'Failed to update configuration'
        });
      }
    });

    // WhatsApp webhook verification (GET)
    this.app.get('/webhook', (req, res) => {
      const hubMode = req.query['hub.mode'];
      const hubVerifyToken = req.query['hub.verify_token'];
      const hubChallenge = req.query['hub.challenge'];

      console.log('Webhook verification request:', {
        mode: hubMode,
        verifyToken: hubVerifyToken,
        challenge: hubChallenge
      });

      if (hubMode === 'subscribe' && hubVerifyToken === this.config.verifyToken) {
        console.log('Webhook verified successfully');
        res.status(200).send(hubChallenge);
      } else {
        console.log('Webhook verification failed');
        res.status(403).send('Forbidden');
      }
    });

    // WhatsApp webhook message handler (POST)
    this.app.post('/webhook', async (req, res) => {
      try {
        console.log('Webhook received:', JSON.stringify(req.body, null, 2));
        
        const body = req.body;
        
        // Extract WhatsApp message data
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        
        if (!value) {
          console.log('No value in webhook data');
          return res.status(400).send('Invalid webhook data');
        }

        const contacts = value.contacts?.[0];
        const messages = value.messages?.[0];
        const metadata = value.metadata;

        if (!contacts || !messages || !metadata) {
          console.log('Missing required data in webhook');
          return res.status(400).send('Missing required data');
        }

        const waId = contacts.wa_id;
        const contactName = contacts.profile?.name;
        const messageBody = messages.text?.body;
        const messageType = messages.type;
        const phoneNumberId = metadata.phone_number_id;

        console.log("===========================");
        console.log('Phone Number From:', waId);
        console.log('Contact Name:', contactName);
        console.log('Message Body:', messageBody);
        console.log('Message Type:', messageType);
        console.log('Phone Number ID:', phoneNumberId);

        // Emit to Socket.io for real-time display
        if (this.io) {
          const messageData = {
            id: Date.now().toString(),
            text: messageBody,
            timestamp: new Date(),
            from: waId,
            contactName: contactName,
            type: messageType
          };
          
          // Emit to all connected clients
          this.io.emit('apiData', messageData);
          console.log('Message emitted to Socket.io clients:', messageData);
        }

        // Auto-reply to WhatsApp
        await this.sendAutoReply(waId, messageBody, phoneNumberId);

        res.status(200).send('OK');
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    // Send message endpoint
    this.app.post('/send-message', async (req, res) => {
      try {
        const { to, message } = req.body;
        
        if (!to || !message) {
          return res.status(400).json({
            error: 'Missing required fields: to, message'
          });
        }

        const result = await this.sendMessage(to, message);
        res.json(result);
      } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
          error: 'Failed to send message'
        });
      }
    });

    // Test webhook endpoint with your number
    this.app.post('/test-webhook', async (req, res) => {
      try {
        const { message } = req.body;
        const testMessage = message || 'Test message from 7617028576';
        
        // Simulate WhatsApp webhook data
        const webhookData = {
          object: "whatsapp_business_account",
          entry: [{
            id: "123456789",
            changes: [{
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "15551537571",
                  phone_number_id: "123456789012345"
                },
                contacts: [{
                  profile: {
                    name: "Test User (7617028576)"
                  },
                  wa_id: "7617028576"
                }],
                messages: [{
                  from: "7617028576",
                  id: "wamid.test" + Date.now(),
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: testMessage
                  },
                  type: "text"
                }]
              },
              field: "messages"
            }]
          }]
        };

        console.log('Test webhook received:', JSON.stringify(webhookData, null, 2));
        
        // Process the webhook data
        const entry = webhookData.entry[0];
        const changes = entry.changes[0];
        const value = changes.value;
        
        const contacts = value.contacts[0];
        const messages = value.messages[0];
        const metadata = value.metadata;

        const waId = contacts.wa_id;
        const contactName = contacts.profile?.name;
        const messageBody = messages.text?.body;
        const messageType = messages.type;
        const phoneNumberId = metadata.phone_number_id;

        console.log("===========================");
        console.log('Phone Number From:', waId);
        console.log('Contact Name:', contactName);
        console.log('Message Body:', messageBody);
        console.log('Message Type:', messageType);
        console.log('Phone Number ID:', phoneNumberId);

        // Emit to Socket.io for real-time display
        if (this.io) {
          const messageData = {
            id: Date.now().toString(),
            text: messageBody,
            timestamp: new Date(),
            from: waId,
            contactName: contactName,
            type: messageType
          };
          
          // Emit to all connected clients
          this.io.emit('apiData', messageData);
          console.log('Message emitted to Socket.io clients:', messageData);
        }

        res.json({
          success: true,
          message: 'Test webhook processed successfully',
          data: {
            from: waId,
            contactName: contactName,
            message: messageBody
          }
        });
      } catch (error) {
        console.error('Error processing test webhook:', error);
        res.status(500).json({
          error: 'Failed to process test webhook'
        });
      }
    });

    // Test Socket.io endpoint
    this.app.post('/test-socket', (req, res) => {
      try {
        const { message } = req.body;
        const testMessage = message || 'Test message from webhook server';
        
        if (this.io) {
          const messageData = {
            id: Date.now().toString(),
            text: testMessage,
            timestamp: new Date(),
            from: '7617028576',
            contactName: 'Test User (7617028576)',
            type: 'text'
          };
          
          this.io.emit('apiData', messageData);
          console.log('Test message emitted to Socket.io:', messageData);
          
          res.json({
            success: true,
            message: 'Test message sent to Socket.io',
            data: messageData
          });
        } else {
          res.status(500).json({
            error: 'Socket.io not initialized'
          });
        }
      } catch (error) {
        console.error('Error sending test message:', error);
        res.status(500).json({
          error: 'Failed to send test message'
        });
      }
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('Client connected to webhook server:', socket.id);

      socket.on('message', (data) => {
        console.log('Message received from client:', data);
        this.io.emit('message', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from webhook server:', socket.id);
      });
    });
  }

  async sendAutoReply(waId, originalMessage, phoneNumberId) {
    if (!this.config.accessToken) {
      console.error('No access token configured for auto-reply');
      return;
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: waId,
      type: "text",
      text: {
        preview_url: false,
        body: `Hello! Your message received: "${originalMessage}"\n\nThis is an auto-reply from WhatsApp Webhook Server.`
      }
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.accessToken}`
    };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        payload,
        { headers }
      );

      console.log('Auto-reply sent successfully:', response?.data);
      return response.data;
    } catch (error) {
      console.error('Error sending auto-reply:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendMessage(to, message) {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      throw new Error('WhatsApp configuration not complete');
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.accessToken}`
    };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v20.0/${this.config.phoneNumberId}/messages`,
        payload,
        { headers }
      );

      console.log('Message sent successfully:', response?.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  start() {
    this.server.listen(this.config.port, () => {
      console.log(`🚀 WhatsApp Webhook Server running on port ${this.config.port}`);
      console.log(`📱 Webhook URL: http://localhost:${this.config.port}/webhook`);
      console.log(`⚙️  Config endpoint: http://localhost:${this.config.port}/config`);
      console.log(`❤️  Health check: http://localhost:${this.config.port}/health`);
      console.log(`📤 Send message: http://localhost:${this.config.port}/send-message`);
    });
  }

  getIO() {
    return this.io;
  }

  getConfig() {
    return this.config;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Start the webhook server
const webhookServer = new WhatsAppWebhookServer();
webhookServer.start();

// Make it accessible globally
global.webhookServer = webhookServer;

module.exports = WhatsAppWebhookServer;
