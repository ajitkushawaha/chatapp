#!/bin/bash

# Production Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="whatsapp-chat"
SERVER_USER="root"
SERVER_HOST="your-server-ip"
SERVER_PATH="/var/www/whatsapp-chat"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the application
print_status "Building application..."
npm run build

# Create logs directory
mkdir -p logs

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Deploying to production..."
    
    # Stop existing processes
    print_status "Stopping existing processes..."
    pm2 stop all || true
    
    # Start with PM2
    print_status "Starting with PM2..."
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    print_status "✅ Production deployment completed!"
    print_status "Check status with: pm2 status"
    print_status "View logs with: pm2 logs"
    
elif [ "$ENVIRONMENT" = "docker" ]; then
    print_status "Deploying with Docker..."
    
    # Build Docker image
    print_status "Building Docker image..."
    docker build -t $APP_NAME .
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down || true
    
    # Start with Docker Compose
    print_status "Starting with Docker Compose..."
    docker-compose up -d
    
    print_status "✅ Docker deployment completed!"
    print_status "Check status with: docker-compose ps"
    print_status "View logs with: docker-compose logs -f"
    
else
    print_error "Invalid environment. Use 'production' or 'docker'"
    exit 1
fi

# Health check
print_status "Performing health check..."
sleep 5

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "✅ Webhook server is healthy"
else
    print_warning "⚠️  Webhook server health check failed"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Chat application is healthy"
else
    print_warning "⚠️  Chat application health check failed"
fi

print_status "🎉 Deployment completed successfully!"
print_status "Your WhatsApp chat system is now running in $ENVIRONMENT mode."
