const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('A user connected to main server');

    socket.on('message', (data) => {
      console.log('Message received:', data);
      io.emit('message', data);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected from main server');
    });
  });

  // Make io accessible to API routes
  global.io = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Next.js app ready on http://${hostname}:${port}`);
      console.log(`> Webhook server should be running on port 3001`);
      console.log(`> Configure your WhatsApp webhook URL to: http://your-domain:3001/webhook`);
    });
});
