# 🚀 WhatsApp Chatbot SaaS Setup Guide

## 📋 Prerequisites

Before setting up your WhatsApp Chatbot SaaS platform, ensure you have:

1. **Node.js 18+** and npm 8+
2. **Firebase Project** with Firestore and Authentication enabled
3. **OpenAI API Key** for AI-powered responses
4. **WhatsApp Business API** credentials
5. **Stripe Account** (for payment processing)
6. **Domain name** and SSL certificate (for production)

## 🛠️ Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/whatsapp-chatbot-saas.git
cd whatsapp-chatbot-saas

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enable the following services:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage** (optional)

#### Get Firebase Configuration
1. Go to Project Settings → General
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app
4. Copy the configuration object

#### Create Service Account
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file

### 3. Environment Configuration

Create `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project.appspot.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_verify_token
WEBHOOK_URL=https://yourdomain.com/webhook

# Stripe (for payments)
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
```

### 4. OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key
3. Add it to your `.env.local` file

### 5. WhatsApp Business API Setup

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a WhatsApp Business app
3. Get your credentials:
   - Access Token
   - Phone Number ID
   - Verify Token
4. Set up webhook URL: `https://yourdomain.com/webhook`

### 6. Stripe Setup (for SaaS billing)

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the dashboard
3. Set up webhook endpoints for payment processing

## 🚀 Running the Application

### Development Mode

```bash
# Start both frontend and webhook server
npm run dev:full

# Or start individually
npm run dev          # Frontend only
npm run webhook      # Webhook server only
```

### Production Mode

```bash
# Build the application
npm run build

# Start production servers
npm run start:full

# Or use PM2 for process management
npm run start:production
```

## 🎯 Usage Guide

### 1. User Registration
- Visit `http://localhost:3000/auth/register`
- Create an account with email and password
- Verify your email address

### 2. Dashboard Access
- After login, you'll be redirected to `/dashboard`
- View analytics, system status, and quick actions

### 3. Flow Builder
- Navigate to `/flows` to create conversation flows
- Add triggers (keywords) and responses
- Test your flows with the preview feature

### 4. WhatsApp Configuration
- Go to Settings → WhatsApp Configuration
- Enter your WhatsApp Business API credentials
- Test the connection

### 5. Team Inbox
- View all conversations in `/chats`
- Take over conversations manually
- Monitor chatbot performance

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Chat
- `POST /api/chat` - Send message to chatbot
- `GET /api/chat?conversationId=xxx` - Get conversation history

### Flows
- `GET /api/flows?userId=xxx` - Get user's flows
- `POST /api/flows` - Create new flow
- `PUT /api/flows` - Update existing flow
- `DELETE /api/flows?flowId=xxx` - Delete flow

### Webhooks
- `POST /webhook` - WhatsApp webhook endpoint
- `GET /webhook` - Webhook verification

## 💰 SaaS Features

### Pricing Tiers
- **Free**: 1,000 messages/month, 5 flows
- **Pro**: $29/month, 10,000 messages, unlimited flows
- **Enterprise**: $99/month, 100,000 messages, custom features

### Multi-tenant Architecture
- Each user has isolated data
- Role-based access control
- Subscription management

### Analytics & Monitoring
- Real-time metrics
- User engagement tracking
- System health monitoring

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t whatsapp-chatbot-saas .
docker run -p 3000:3000 -p 3001:3001 whatsapp-chatbot-saas
```

### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start with PM2
npm run start:production

# Monitor
pm2 monit
```

### Manual Deployment
```bash
# Build the application
npm run build

# Start production servers
npm run start:full
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Firebase Rules**: Set up proper Firestore security rules
3. **API Keys**: Rotate API keys regularly
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Input Validation**: Sanitize all user inputs

## 📊 Monitoring & Analytics

### Built-in Analytics
- Message volume tracking
- Response time monitoring
- User engagement metrics
- Flow performance analysis

### External Monitoring
- Set up error tracking (Sentry)
- Monitor server performance
- Track API usage and costs

## 🆘 Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Check Firebase configuration
   - Verify service account permissions
   - Ensure Firestore is enabled

2. **WhatsApp Webhook Not Working**
   - Verify webhook URL is accessible
   - Check WhatsApp API credentials
   - Ensure webhook server is running

3. **OpenAI API Errors**
   - Verify API key is correct
   - Check API usage limits
   - Ensure proper request format

4. **Socket.io Connection Issues**
   - Check CORS configuration
   - Verify server is running on correct port
   - Check firewall settings

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev:full
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Support

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/whatsapp-chatbot-saas/issues)
- **Email Support**: support@yourdomain.com
- **Documentation**: [docs.yourdomain.com](https://docs.yourdomain.com)

---

**Happy Building! 🎉**
