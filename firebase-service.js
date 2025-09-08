const admin = require('firebase-admin');
require('dotenv').config({ path: './env.local' });

class FirebaseService {
  constructor() {
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      // Initialize Firebase Admin SDK
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "leadgenarator-dfe18",
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
          storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET || "leadgenarator-dfe18.firebasestorage.app",
        });
      }

      this.db = admin.firestore();
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin SDK:', error);
      this.db = null;
    }
  }

  // Contact Management
  async saveContact(contactData) {
    if (!this.db) return null;

    try {
      const contactRef = this.db.collection('contacts').doc(contactData.waId);
      const contactDoc = await contactRef.get();

      if (contactDoc.exists) {
        // Update existing contact
        await contactRef.update({
          ...contactData,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`📝 Updated contact: ${contactData.contactName} (${contactData.waId})`);
      } else {
        // Create new contact
        await contactRef.set({
          ...contactData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: 1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`👤 New contact created: ${contactData.contactName} (${contactData.waId})`);
      }

      return contactRef.id;
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      return null;
    }
  }

  async getContact(waId) {
    if (!this.db) return null;

    try {
      const contactDoc = await this.db.collection('contacts').doc(waId).get();
      return contactDoc.exists ? { id: contactDoc.id, ...contactDoc.data() } : null;
    } catch (error) {
      console.error('❌ Error getting contact:', error);
      return null;
    }
  }

  async getAllContacts() {
    if (!this.db) return [];

    try {
      const contactsSnapshot = await this.db.collection('contacts')
        .orderBy('lastMessageAt', 'desc')
        .get();
      
      return contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting all contacts:', error);
      return [];
    }
  }

  // Chat History Management
  async saveMessage(messageData) {
    if (!this.db) return null;

    try {
      const messageRef = this.db.collection('messages').doc();
      await messageRef.set({
        ...messageData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`💬 Message saved: ${messageData.type} from ${messageData.from}`);
      return messageRef.id;
    } catch (error) {
      console.error('❌ Error saving message:', error);
      return null;
    }
  }

  async getChatHistory(waId, limit = 50) {
    if (!this.db) return [];

    try {
      const messagesSnapshot = await this.db.collection('messages')
        .where('from', '==', waId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('❌ Error getting chat history:', error);
      return [];
    }
  }

  async getAllMessages(limit = 100) {
    if (!this.db) return [];

    try {
      const messagesSnapshot = await this.db.collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting all messages:', error);
      return [];
    }
  }

  // Conversation Management
  async createConversation(conversationData) {
    if (!this.db) return null;

    try {
      const conversationRef = this.db.collection('conversations').doc();
      await conversationRef.set({
        ...conversationData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      });

      console.log(`🗣️ Conversation created: ${conversationData.contactName}`);
      return conversationRef.id;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      return null;
    }
  }

  async updateConversation(conversationId, updateData) {
    if (!this.db) return false;

    try {
      await this.db.collection('conversations').doc(conversationId).update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('❌ Error updating conversation:', error);
      return false;
    }
  }

  async getConversations(limit = 50) {
    if (!this.db) return [];

    try {
      const conversationsSnapshot = await this.db.collection('conversations')
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();

      return conversationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      return [];
    }
  }

  // Analytics
  async getAnalytics() {
    if (!this.db) return null;

    try {
      const [contactsSnapshot, messagesSnapshot, conversationsSnapshot] = await Promise.all([
        this.db.collection('contacts').get(),
        this.db.collection('messages').get(),
        this.db.collection('conversations').get()
      ]);

      const totalContacts = contactsSnapshot.size;
      const totalMessages = messagesSnapshot.size;
      const totalConversations = conversationsSnapshot.size;

      // Get messages from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentMessagesSnapshot = await this.db.collection('messages')
        .where('timestamp', '>=', yesterday)
        .get();

      const messagesLast24h = recentMessagesSnapshot.size;

      return {
        totalContacts,
        totalMessages,
        totalConversations,
        messagesLast24h,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      return null;
    }
  }

  // Utility methods
  async isContactExists(waId) {
    if (!this.db) return false;

    try {
      const contactDoc = await this.db.collection('contacts').doc(waId).get();
      return contactDoc.exists;
    } catch (error) {
      console.error('❌ Error checking contact existence:', error);
      return false;
    }
  }

  async getContactByPhone(phoneNumber) {
    if (!this.db) return null;

    try {
      const contactsSnapshot = await this.db.collection('contacts')
        .where('waId', '==', phoneNumber)
        .limit(1)
        .get();

      if (contactsSnapshot.empty) return null;

      const doc = contactsSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error getting contact by phone:', error);
      return null;
    }
  }
}

module.exports = FirebaseService;
