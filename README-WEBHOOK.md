# WhatsApp Webhook Server Setup

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env.local` file in the root directory:
```env
# WhatsApp Business API Configuration
WHATSAPP_TOKEN=your_whatsapp_access_token_here
PHONE_NUMBER_ID=your_phone_number_id_here
VERIFY_TOKEN=123456
WEBHOOK_URL=https://your-domain.com/webhook

# Server Configuration
NODE_ENV=development
PORT=3000
WEBHOOK_PORT=3001
```

### 3. Start the Servers

#### Option 1: Start Both Servers Together
```bash
npm run dev:full
```

#### Option 2: Start Servers Separately
```bash
# Terminal 1 - Main Next.js App
npm run dev

# Terminal 2 - Webhook Server
npm run webhook
```

#### Option 3: Use the Custom Starter
```bash
node start-servers.js
```

## 📱 WhatsApp Business API Setup

### 1. Get Your Credentials
1. Go to [Facebook Developers Console](https://developers.facebook.com/)
2. Select your WhatsApp Business app
3. Go to **WhatsApp > API Setup**
4. Copy:
   - **Temporary access token**
   - **Phone number ID**

### 2. Configure Webhook
1. In Facebook Developer Console, go to **WhatsApp > Configuration**
2. Set **Callback URL**: `https://your-domain.com/webhook`
3. Set **Verify Token**: `123456` (or your custom token)
4. Subscribe to **messages** events

### 3. For Local Development
Use ngrok to expose your local server:
```bash
# Install ngrok
npm install -g ngrok

# Expose webhook server
ngrok http 3001

# Use the ngrok URL in Facebook Developer Console
# Example: https://abc123.ngrok.io/webhook
```

## 🔧 Server Endpoints

### Webhook Server (Port 3001)
- **GET** `/webhook` - Webhook verification
- **POST** `/webhook` - Receive WhatsApp messages
- **GET** `/config` - Get current configuration
- **POST** `/config` - Update configuration
- **GET** `/health` - Health check
- **POST** `/send-message` - Send WhatsApp message

### Main App (Port 3000)
- **GET** `/` - Chat interface
- **GET** `/api/config` - Configuration API
- **POST** `/api/config` - Update configuration

## 📊 How It Works

1. **WhatsApp Message** → Facebook Graph API
2. **Graph API** → Your webhook server (`:3001/webhook`)
3. **Webhook Server** → Processes message and emits to Socket.io
4. **Socket.io** → Broadcasts to all connected clients
5. **Frontend** → Displays message in real-time
6. **Auto-reply** → Sends response back to WhatsApp user

## 🛠️ Configuration

### Update Configuration via API
```bash
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "your_token_here",
    "phoneNumberId": "your_phone_id_here",
    "verifyToken": "123456",
    "webhookUrl": "https://your-domain.com/webhook"
  }'
```

### Send Test Message
```bash
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890",
    "message": "Hello from webhook server!"
  }'
```

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### View Configuration
```bash
curl http://localhost:3001/config
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Verification Failed**
   - Check verify token matches in Facebook Developer Console
   - Ensure webhook URL is publicly accessible

2. **Messages Not Received**
   - Verify access token is valid
   - Check phone number ID is correct
   - Ensure webhook is subscribed to messages events

3. **Auto-reply Not Working**
   - Check access token permissions
   - Verify phone number ID
   - Check Facebook Graph API logs

### Logs
Both servers provide detailed logging:
- Main server: Next.js app logs
- Webhook server: Express server logs with WhatsApp API details

## 🔒 Security Notes

- Keep your access token secure
- Use HTTPS in production
- Validate webhook signatures in production
- Implement rate limiting for production use

## 📈 Production Deployment

1. Set environment variables in your hosting platform
2. Use a reverse proxy (nginx) to handle SSL
3. Set up proper logging and monitoring
4. Implement webhook signature verification
5. Use a process manager like PM2

```bash
# Production with PM2
npm install -g pm2
pm2 start webhook-server.js --name "whatsapp-webhook"
pm2 start server.js --name "whatsapp-app"
```
