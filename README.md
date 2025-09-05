# WhatsApp Real-Time Chat - Next.js Version

A modern Next.js application that provides real-time WhatsApp message monitoring using Socket.io and WhatsApp Business API.

## Features

- 🚀 **Next.js 15** with TypeScript and Tailwind CSS
- 📱 **WhatsApp Business API** integration
- ⚡ **Real-time messaging** with Socket.io
- 🎨 **Modern UI** with responsive design
- 🔄 **Auto-reply** functionality
- 📊 **Live message monitoring**

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# WhatsApp Business API Configuration
WHATSAPP_TOKEN=your_whatsapp_access_token_here

# Server Configuration
NODE_ENV=development
PORT=3000
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## WhatsApp Business API Setup

### 1. Configure Webhook

Set up your WhatsApp Business API webhook with the following settings:

- **Webhook URL**: `https://your-domain.com/api/webhook`
- **Verify Token**: `123456`
- **Webhook Fields**: Subscribe to `messages` events

### 2. Update Access Token

Replace the placeholder token in the webhook route with your actual WhatsApp Business API access token.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts          # WhatsApp webhook handler
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat interface
├── lib/
│   └── socket.ts                 # Socket.io types
└── pages/
    └── api/
        └── socket.ts             # Socket.io server setup
```

## API Endpoints

### Webhook Endpoint

- **GET** `/api/webhook` - Webhook verification
- **POST** `/api/webhook` - Receive WhatsApp messages

### Socket.io

- **WebSocket** `/api/socket` - Real-time communication

## How It Works

1. **WhatsApp Message** → Facebook Graph API
2. **Graph API** → Your webhook endpoint (`/api/webhook`)
3. **Webhook** → Processes message and emits to Socket.io
4. **Socket.io** → Broadcasts to all connected clients
5. **Frontend** → Displays message in real-time
6. **Auto-reply** → Sends response back to WhatsApp user

## Development

### Available Scripts

- `npm run dev` - Start development server with Socket.io
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Custom Server

This project uses a custom server (`server.js`) to integrate Socket.io with Next.js. The server handles both HTTP requests and WebSocket connections.

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables in your hosting platform

3. Start the production server:
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Socket.io Connection Failed**
   - Ensure the custom server is running
   - Check CORS settings in `server.js`

2. **Webhook Verification Failed**
   - Verify the webhook URL is accessible
   - Check the verify token matches (`123456`)

3. **WhatsApp Messages Not Received**
   - Verify your access token is valid
   - Check webhook subscription in Facebook Developer Console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Credits

Original project by [SlowCoder](https://youtu.be/t01qNtfk0C0)
Converted to Next.js with modern improvements.