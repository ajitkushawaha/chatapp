#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WhatsApp Real-Time Chat Servers...\n');

// Start the main Next.js server
const mainServer = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Start the webhook server
const webhookServer = spawn('node', ['webhook-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  mainServer.kill('SIGINT');
  webhookServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  mainServer.kill('SIGTERM');
  webhookServer.kill('SIGTERM');
  process.exit(0);
});

// Handle server crashes
mainServer.on('close', (code) => {
  console.log(`Main server exited with code ${code}`);
  if (code !== 0) {
    webhookServer.kill();
    process.exit(code);
  }
});

webhookServer.on('close', (code) => {
  console.log(`Webhook server exited with code ${code}`);
  if (code !== 0) {
    mainServer.kill();
    process.exit(code);
  }
});
