module.exports = {
  apps: [
    {
      name: 'whatsapp-chat',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/chat-error.log',
      out_file: './logs/chat-out.log',
      log_file: './logs/chat-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
