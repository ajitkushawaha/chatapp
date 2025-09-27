const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
require('dotenv').config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create Socket.io server
  const io = new Server(server, {
    path: '/api/socketio',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store io instance globally for use in API routes
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected to Next.js Socket.io:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from Next.js Socket.io:', socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});