# 🚀 Production Deployment Guide

## 📋 Prerequisites

1. **Domain Name**: Purchase a domain (e.g., `yourdomain.com`)
2. **SSL Certificate**: Get SSL certificate (Let's Encrypt recommended)
3. **Server**: VPS/Cloud server (DigitalOcean, AWS, Google Cloud, etc.)
4. **WhatsApp Business API**: Production credentials from Meta

## 🏗️ Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Deploy Application
```bash
# Clone your repository
git clone https://github.com/yourusername/whatsapp-chat.git
cd whatsapp-chat

# Create production environment file
cp env.production.example .env.local

# Edit environment variables
nano .env.local
```

#### 3. Configure Environment Variables
```bash
# Update .env.local with your production values
WHATSAPP_TOKEN=your_production_access_token
PHONE_NUMBER_ID=your_production_phone_number_id
VERIFY_TOKEN=your_secure_verify_token
WEBHOOK_URL=https://yourdomain.com/webhook
```

#### 4. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 2: PM2 Deployment

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Create PM2 Configuration
```json
{
  "apps": [
    {
      "name": "whatsapp-chat",
      "script": "server.js",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      }
    }
  ]
}
```

#### 3. Start Applications
```bash
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

## 🔒 SSL Certificate Setup

### Using Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌐 Domain Configuration

### 1. DNS Settings
```
A Record: yourdomain.com → YOUR_SERVER_IP
A Record: www.yourdomain.com → YOUR_SERVER_IP
```

### 2. Update Meta Developer Dashboard
- **Webhook URL**: `https://yourdomain.com/webhook`
- **Verify Token**: Your secure verify token
- **Subscribe to**: `messages` events

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. System Monitoring
```bash
# Install htop for system monitoring
sudo apt install htop

# Monitor system resources
htop
```

## 🔧 Production Optimizations

### 1. Update package.json Scripts
```json
{
  "scripts": {
    "start": "NODE_ENV=production node server.js",
    "start:production": "pm2 start ecosystem.config.json",
    "build": "next build",
    "deploy": "npm run build && pm2 restart all"
  }
}
```

### 2. Environment-Specific Configuration
```javascript
// next.config.ts
const nextConfig = {
  output: 'standalone',
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
}

module.exports = nextConfig
```

## 🚨 Security Checklist

- [ ] Use strong, unique passwords
- [ ] Enable firewall (UFW)
- [ ] Keep system updated
- [ ] Use SSL certificates
- [ ] Implement rate limiting
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Use environment variables for secrets

## 🔄 Backup Strategy

### 1. Database Backup (if using database)
```bash
# Create backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Application Backup
```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/app
```

## 📈 Scaling Considerations

### 1. Load Balancing
- Use multiple server instances
- Implement Redis for session storage
- Use CDN for static assets

### 2. Database Scaling
- Use connection pooling
- Implement read replicas
- Consider database sharding

## 🆘 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000/3001 are available
2. **SSL issues**: Verify certificate installation
3. **Webhook failures**: Check Meta Dashboard configuration
4. **Memory issues**: Monitor server resources

### Log Locations
- Application logs: `pm2 logs`
- System logs: `/var/log/syslog`
- Nginx logs: `/var/log/nginx/`

## 📞 Support

For production support:
1. Check application logs
2. Monitor system resources
3. Verify webhook connectivity
4. Test WhatsApp message flow

---

**🎉 Your WhatsApp chat system is now production-ready!**
