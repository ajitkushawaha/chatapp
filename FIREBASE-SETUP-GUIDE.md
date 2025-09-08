# 🔥 Firebase Setup Guide for WhatsApp Chatbot SaaS

## 📋 Prerequisites

1. **Firebase Project**: `leadgenarator-dfe18` (already created)
2. **Firebase CLI**: Install if not already installed
3. **Node.js**: Version 18+ (already installed)

## 🚀 Step 1: Enable Firebase Services

### 1.1 Authentication Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `leadgenarator-dfe18`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the following providers:
   - ✅ **Email/Password**
   - ✅ **Google** (optional)
   - ✅ **Phone** (optional)

### 1.2 Firestore Database Setup
1. Navigate to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click **Done**

### 1.3 Storage Setup
1. Navigate to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select the same location as Firestore
5. Click **Done**

## 🔑 Step 2: Generate Service Account Key

### 2.1 Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `leadgenarator-dfe18`
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Fill in details:
   - **Name**: `whatsapp-chatbot-saas`
   - **Description**: `Service account for WhatsApp Chatbot SaaS platform`
6. Click **Create and Continue**

### 2.2 Assign Roles
Add the following roles:
- ✅ **Firebase Admin**
- ✅ **Cloud Firestore User**
- ✅ **Storage Admin**

### 2.3 Generate Key
1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Download the key file
6. **⚠️ IMPORTANT**: Keep this file secure and never commit it to version control

## 🔧 Step 3: Update Environment Variables

### 3.1 Update `env.local` file
Replace the placeholder values in your `env.local` file:

```bash
# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=leadgenarator-dfe18
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@leadgenarator-dfe18.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_STORAGE_BUCKET=leadgenarator-dfe18.firebasestorage.app
```

### 3.2 Get the values from your service account JSON:
- `FIREBASE_ADMIN_CLIENT_EMAIL`: Use the `client_email` field
- `FIREBASE_ADMIN_PRIVATE_KEY`: Use the `private_key` field (keep the quotes and \n)

## 🗄️ Step 4: Set Up Firestore Collections

### 4.1 Create Initial Collections
Run the following commands to set up your database structure:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore
```

### 4.2 Database Structure
Your Firestore will have these collections:

```
users/
├── {userId}/
│   ├── displayName: string
│   ├── email: string
│   ├── createdAt: timestamp
│   ├── subscription: string
│   └── settings: object

flows/
├── {flowId}/
│   ├── name: string
│   ├── description: string
│   ├── nodes: array
│   ├── edges: array
│   ├── userId: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

chats/
├── {chatId}/
│   ├── userId: string
│   ├── phoneNumber: string
│   ├── contactName: string
│   ├── messages: array
│   ├── status: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

broadcasts/
├── {broadcastId}/
│   ├── userId: string
│   ├── name: string
│   ├── message: string
│   ├── recipients: array
│   ├── status: string
│   ├── createdAt: timestamp
│   └── sentAt: timestamp
```

## 🔒 Step 5: Set Up Security Rules

### 5.1 Firestore Security Rules
Update your Firestore rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Flows are private to each user
    match /flows/{flowId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Chats are private to each user
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Broadcasts are private to each user
    match /broadcasts/{broadcastId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 5.2 Storage Security Rules
Update your Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Step 6: Test Firebase Integration

### 6.1 Test Authentication
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Try to register a new account
4. Check Firebase Console → Authentication to see the new user

### 6.2 Test Firestore
1. Create a new flow in the Flow Builder
2. Check Firebase Console → Firestore to see the new document

### 6.3 Test Storage
1. Upload a file in the dashboard
2. Check Firebase Console → Storage to see the uploaded file

## 🚨 Troubleshooting

### Common Issues:

1. **"Firebase App named '[DEFAULT]' already exists"**
   - Solution: Restart your development server

2. **"Permission denied" errors**
   - Solution: Check your Firestore security rules

3. **"Invalid API key" errors**
   - Solution: Verify your Firebase configuration in `src/lib/firebase.ts`

4. **Service account authentication fails**
   - Solution: Check your environment variables and private key format

## 📚 Next Steps

1. **Set up OpenAI API** for AI-powered responses
2. **Configure WhatsApp Business API** for real messaging
3. **Set up payment processing** with Stripe
4. **Deploy to production** using the provided Docker setup

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**🎉 Congratulations!** Your Firebase backend is now ready for your WhatsApp Chatbot SaaS platform!
