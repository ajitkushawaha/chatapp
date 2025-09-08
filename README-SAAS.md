# 🤖 WhatsApp Chatbot SaaS Platform

A comprehensive, production-ready SaaS platform for building and managing WhatsApp chatbots with AI-powered responses, flow builders, and team collaboration features.

## 🚀 Features

### Core Functionality
- **Real-time WhatsApp Integration** - Connect with WhatsApp Business API
- **AI-Powered Chatbot** - GPT-4 integration for intelligent responses
- **Visual Flow Builder** - Drag-and-drop interface for creating conversation flows
- **Team Inbox** - Manage conversations with manual agent takeover
- **Broadcast Messaging** - Send messages to multiple users
- **Analytics Dashboard** - Track performance and user engagement

### SaaS Features
- **Multi-tenant Architecture** - Support for multiple businesses
- **User Authentication** - Firebase Auth with role-based access
- **Subscription Management** - Stripe integration for billing
- **Plan Management** - Free, Pro, and Enterprise tiers
- **API Access** - RESTful APIs for third-party integrations
- **Webhook Support** - Real-time event notifications

### Technical Features
- **Modern Tech Stack** - Next.js 15, React 19, TypeScript
- **Real-time Updates** - Socket.io for live messaging
- **Database** - Firebase Firestore for scalable data storage
- **Authentication** - Firebase Auth with JWT tokens
- **AI Integration** - OpenAI GPT-4 for intelligent responses
- **Production Ready** - Docker, PM2, Nginx configuration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Webhook API   │    │ • WhatsApp API  │
│ • Flow Builder  │    │ • Chat API      │    │ • OpenAI API    │
│ • Team Inbox    │    │ • Auth API      │    │ • Firebase      │
│ • Analytics     │    │ • Socket.io     │    │ • Stripe        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- Firebase project with Firestore enabled
- OpenAI API key
- WhatsApp Business API credentials
- Stripe account (for payments)
- Domain name and SSL certificate (for production)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/whatsapp-chatbot-saas.git
cd whatsapp-chatbot-saas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_verify_token

# Stripe (for payments)
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### 4. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Download service account key for server-side operations
5. Update Firebase configuration in `.env.local`

### 5. Run Development Server
```bash
npm run dev:full
```

This will start:
- Next.js frontend on `http://localhost:3000`
- Express webhook server on `http://localhost:3001`

## 🎯 Usage

### 1. User Registration
- Visit `http://localhost:3000/auth/register`
- Create an account with email and password
- Verify email address

### 2. WhatsApp Configuration
- Go to Settings → WhatsApp Configuration
- Enter your WhatsApp Business API credentials
- Test the connection

### 3. Create Conversation Flows
- Navigate to Flow Builder
- Create triggers (keywords that activate the flow)
- Define responses (messages sent to users)
- Activate flows

### 4. Test the Chatbot
- Send a WhatsApp message to your business number
- The chatbot will respond based on your flows
- If no flow matches, AI will generate a response

### 5. Monitor Performance
- Check the Dashboard for analytics
- View conversation history in Team Inbox
- Monitor system status and usage

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

## 💰 SaaS Pricing Tiers

### Free Plan
- 1,000 messages/month
- 5 conversation flows
- Basic analytics
- Email support

### Pro Plan ($29/month)
- 10,000 messages/month
- Unlimited flows
- Advanced analytics
- Team collaboration
- Priority support

### Enterprise Plan ($99/month)
- 100,000 messages/month
- Custom integrations
- Dedicated support
- Advanced security
- Custom branding

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

## 🔒 Security Features

- **Authentication** - Firebase Auth with JWT tokens
- **Authorization** - Role-based access control
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Configured for production
- **Input Validation** - Sanitize all user inputs
- **HTTPS Only** - SSL/TLS encryption
- **Environment Variables** - Secure configuration management

## 📊 Monitoring & Analytics

- **Real-time Metrics** - Message volume, response times
- **User Analytics** - Active users, engagement rates
- **Flow Performance** - Trigger frequency, success rates
- **System Health** - API status, error rates
- **Business Metrics** - Revenue, churn, growth

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - [docs.yourdomain.com](https://docs.yourdomain.com)
- **Email Support** - support@yourdomain.com
- **Community Forum** - [community.yourdomain.com](https://community.yourdomain.com)
- **GitHub Issues** - [github.com/yourusername/whatsapp-chatbot-saas/issues](https://github.com/yourusername/whatsapp-chatbot-saas/issues)

## 🎉 Acknowledgments

- OpenAI for GPT-4 API
- Meta for WhatsApp Business API
- Firebase for backend services
- Next.js team for the amazing framework
- All contributors and users

---

**Built with ❤️ for the future of customer communication**
