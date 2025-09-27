import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Load environment variables for server-side operations
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' });
}

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
let firebaseError: string | null = null;
let db: any = null;

async function initializeFirebase() {
  if (firebaseInitialized) {
    return { success: true, db };
  }

  if (firebaseError) {
    return { success: false, error: firebaseError };
  }

  try { 
    // Ensure environment variables are loaded
    if (typeof window === 'undefined') {
      require('dotenv').config({ path: '.env.local' });
    }
    
    console.log('🔍 Debug Firebase Environment Variables:');
    console.log('FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID ? 'SET' : 'NOT SET');
    console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'SET' : 'NOT SET');
    console.log('FIREBASE_ADMIN_PRIVATE_KEY:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'SET' : 'NOT SET');
    
    // Use hardcoded values for testing
    const serviceAccount = {
      projectId: 'leadgenarator-dfe18',
      clientEmail: 'firebase-adminsdk-fbsvc@leadgenarator-dfe18.iam.gserviceaccount.com',
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    console.log('🔍 Service Account Debug:');
    console.log('Project ID:', serviceAccount.projectId);
    console.log('Client Email:', serviceAccount.clientEmail);
    console.log('Private Key starts with:', serviceAccount.privateKey?.substring(0, 50));
    console.log('Private Key ends with:', serviceAccount.privateKey?.substring(serviceAccount.privateKey.length - 50));

    // Check if Firebase credentials are properly configured
    if (!serviceAccount.projectId) {
      firebaseError = 'FIREBASE_ADMIN_PROJECT_ID is not set in environment variables';
      throw new Error(firebaseError);
    }
    
    if (!serviceAccount.clientEmail) {
      firebaseError = 'FIREBASE_ADMIN_CLIENT_EMAIL is not set in environment variables';
      throw new Error(firebaseError);
    }
    
    if (!serviceAccount.privateKey || serviceAccount.privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
      firebaseError = 'FIREBASE_ADMIN_PRIVATE_KEY is not set or contains placeholder value';
      throw new Error(firebaseError);
    }
    
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    
    db = getFirestore();
    
    // Test the connection by trying to access Firestore
    try {
      // This will throw an error if authentication fails
      await db.collection('_test').limit(1).get();
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      return { success: true, db };
    } catch (authError) {
      firebaseError = `Firebase authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`;
      console.error('❌ Firebase authentication failed:', firebaseError);
      console.error('❌ Full error details:', authError);
      throw new Error(firebaseError);
    }
  } catch (error) {
    firebaseError = error instanceof Error ? error.message : 'Unknown Firebase initialization error';
    console.error('❌ Firebase Admin SDK initialization failed:', firebaseError);
    console.error('❌ All database operations will fail until Firebase is properly configured');
    return { success: false, error: firebaseError };
  }
}

// Firebase will be initialized on first use

export interface StoredMessage {
  id: string;
  text: string;
  timestamp: Date;
  from: string;
  contactName: string;
  type: string;
  direction: 'inbound' | 'outbound';
  phoneNumberId: string;
  originalMessage?: string;
}

export interface StoredContact {
  waId: string;
  contactName: string;
  profileName?: string;
  lastMessage: string;
  lastMessageAt: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class FirebaseService {
  // Save a message to Firebase
  static async saveMessage(message: StoredMessage): Promise<void> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot save message - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      const messageData = {
        ...message,
        timestamp: Timestamp.fromDate(message.timestamp),
        createdAt: Timestamp.now(),
      };

      // Save to messages collection
      await initResult.db.collection('messages').doc(message.id).set(messageData);

      // Update contact info
      await this.updateContact(message.from, message.contactName, message.text, message.timestamp);

      console.log(`✅ Message saved to Firebase for ${message.from}:`, message.text);
    } catch (error) {
      console.error('❌ Error saving message to Firebase:', error);
      throw new Error(`Failed to save message to Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update contact information
  static async updateContact(waId: string, contactName: string, lastMessage: string, lastMessageAt: Date): Promise<void> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      const contactRef = initResult.db.collection('contacts').doc(waId);
      const contactDoc = await contactRef.get();

      if (contactDoc.exists) {
        // Update existing contact
        const currentData = contactDoc.data() as any;
        const contactData = {
          waId,
          contactName,
          profileName: contactName,
          lastMessage,
          lastMessageAt: Timestamp.fromDate(lastMessageAt),
          messageCount: (currentData.messageCount || 0) + 1,
          updatedAt: Timestamp.now(),
        };
        await contactRef.update(contactData);
      } else {
        // Create new contact
        const contactData = {
          waId,
          contactName,
          profileName: contactName,
          lastMessage,
          lastMessageAt: Timestamp.fromDate(lastMessageAt),
          messageCount: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await contactRef.set(contactData);
      }

      console.log(`✅ Contact updated in Firebase: ${waId}`);
    } catch (error) {
      console.error('❌ Error updating contact in Firebase:', error);
      throw new Error(`Failed to update contact in Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get messages for a contact
  static async getMessages(waId: string, limit: number = 50): Promise<StoredMessage[]> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot get messages - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      const messagesSnapshot = await initResult.db
        .collection('messages')
        .where('from', '==', waId)
        .get();

      const messages: StoredMessage[] = [];
      messagesSnapshot.forEach((doc: any) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          text: data.text,
          timestamp: data.timestamp.toDate(),
          from: data.from,
          contactName: data.contactName,
          type: data.type,
          direction: data.direction,
          phoneNumberId: data.phoneNumberId,
          originalMessage: data.originalMessage,
        });
      });

      // Sort by timestamp ascending and limit results
      const sortedMessages = messages
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(-limit); // Get the last N messages

      console.log(`✅ Retrieved ${sortedMessages.length} messages from Firebase for ${waId}`);
      return sortedMessages;
    } catch (error) {
      console.error('❌ Error getting messages from Firebase:', error);
      throw new Error(`Failed to get messages from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all contacts
  static async getContacts(): Promise<StoredContact[]> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot get contacts - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      const contactsSnapshot = await initResult.db
        .collection('contacts')
        .orderBy('lastMessageAt', 'desc')
        .get();

      const contacts: StoredContact[] = [];
      contactsSnapshot.forEach((doc: any) => {
        const data = doc.data();
        contacts.push({
          waId: data.waId,
          contactName: data.contactName,
          profileName: data.profileName,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt.toDate(),
          messageCount: data.messageCount,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      console.log(`✅ Retrieved ${contacts.length} contacts from Firebase`);
      return contacts;
    } catch (error) {
      console.error('❌ Error getting contacts from Firebase:', error);
      throw new Error(`Failed to get contacts from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get contact info
  static async getContact(waId: string): Promise<StoredContact | null> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot get contact - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      const contactDoc = await initResult.db.collection('contacts').doc(waId).get();
      
      if (!contactDoc.exists) {
        return null;
      }

      const data = contactDoc.data() as any;
      return {
        waId: data.waId,
        contactName: data.contactName,
        profileName: data.profileName,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt.toDate(),
        messageCount: data.messageCount,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    } catch (error) {
      console.error('❌ Error getting contact from Firebase:', error);
      throw new Error(`Failed to get contact from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get message count for a contact
  static async getMessageCount(waId: string): Promise<number> {
    if (!firebaseInitialized || !db) {
      return 0;
    }
    
    try {
      const messagesSnapshot = await db
        .collection('messages')
        .where('from', '==', waId)
        .get();

      return messagesSnapshot.size;
    } catch (error) {
      console.error('Error getting message count from Firebase:', error);
      throw error;
    }
  }

  // Delete a message
  static async deleteMessage(messageId: string): Promise<void> {
    if (!firebaseInitialized || !db) {
      return;
    }
    
    try {
      await db.collection('messages').doc(messageId).delete();
      console.log(`Message deleted from Firebase: ${messageId}`);
    } catch (error) {
      console.error('Error deleting message from Firebase:', error);
      throw error;
    }
  }

  // Delete a contact and all their messages
  static async deleteContact(waId: string): Promise<void> {
    if (!firebaseInitialized || !db) {
      return;
    }
    
    try {
      // Delete all messages for this contact
      const messagesSnapshot = await db
        .collection('messages')
        .where('from', '==', waId)
        .get();

      const batch = db.batch();
      messagesSnapshot.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // Delete the contact
      batch.delete(db.collection('contacts').doc(waId));

      await batch.commit();
      console.log(`Contact and messages deleted from Firebase: ${waId}`);
    } catch (error) {
      console.error('Error deleting contact from Firebase:', error);
      throw error;
    }
  }

  // Keywords methods removed - using Flow Builder instead

  // ==================== FLOW METHODS ====================

  /**
   * Get all flows from Firebase
   */
  async getFlows(): Promise<any[]> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot get flows - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      // Get all flows without ordering to avoid index issues
      const snapshot = await initResult.db.collection('flows').get();
      const flows = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
      
      // Sort by updatedAt in JavaScript to avoid Firebase index requirements
      flows.sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      console.log(`✅ Retrieved ${flows.length} flows from Firebase`);
      return flows;
    } catch (error) {
      console.error('❌ Error getting flows from Firebase:', error);
      throw new Error(`Failed to get flows from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save a new flow to Firebase
   */
  async saveFlow(flowData: any): Promise<string> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot save flow - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      const flowWithTimestamps = {
        ...flowData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await initResult.db.collection('flows').add(flowWithTimestamps);
      console.log(`✅ Flow saved to Firebase: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving flow to Firebase:', error);
      throw new Error(`Failed to save flow to Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing flow in Firebase
   */
  async updateFlow(flowId: string, updates: any): Promise<boolean> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot update flow - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await initResult.db.collection('flows').doc(flowId).update(updateData);
      console.log(`✅ Flow updated in Firebase: ${flowId}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating flow in Firebase:', error);
      throw new Error(`Failed to update flow in Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a flow from Firebase
   */
  async deleteFlow(flowId: string): Promise<boolean> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot delete flow - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }

    try {
      await initResult.db.collection('flows').doc(flowId).delete();
      console.log(`✅ Flow deleted from Firebase: ${flowId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting flow from Firebase:', error);
      throw new Error(`Failed to delete flow from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==================== BROADCAST METHODS ====================
  async getBroadcasts(): Promise<any[]> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot get broadcasts - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }
    try {
      const snapshot = await initResult.db.collection('broadcasts').get();
      const broadcasts = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        sentAt: doc.data().sentAt?.toDate() || null,
        scheduledFor: doc.data().scheduledFor?.toDate() || null,
      }));
      broadcasts.sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
      console.log(`✅ Retrieved ${broadcasts.length} broadcasts from Firebase`);
      return broadcasts;
    } catch (error) {
      console.error('❌ Error getting broadcasts from Firebase:', error);
      throw new Error(`Failed to get broadcasts from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveBroadcast(broadcastData: any): Promise<any> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot save broadcast - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }
    try {
      const docRef = await initResult.db.collection('broadcasts').add({
        ...broadcastData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Broadcast saved to Firebase: ${docRef.id}`);
      return {
        id: docRef.id,
        ...broadcastData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error saving broadcast to Firebase:', error);
      throw new Error(`Failed to save broadcast to Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBroadcast(broadcastId: string, updateData: any): Promise<any> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot update broadcast - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }
    try {
      await initResult.db.collection('broadcasts').doc(broadcastId).update({
        ...updateData,
        updatedAt: new Date()
      });
      console.log(`✅ Broadcast updated in Firebase: ${broadcastId}`);
      
      // Return updated broadcast
      const doc = await initResult.db.collection('broadcasts').doc(broadcastId).get();
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate() || new Date(),
          updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
          sentAt: doc.data()?.sentAt?.toDate() || null,
          scheduledFor: doc.data()?.scheduledFor?.toDate() || null,
        };
      }
      throw new Error('Broadcast not found after update');
    } catch (error) {
      console.error('❌ Error updating broadcast in Firebase:', error);
      throw new Error(`Failed to update broadcast in Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteBroadcast(broadcastId: string): Promise<boolean> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot delete broadcast - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }
    try {
      await initResult.db.collection('broadcasts').doc(broadcastId).delete();
      console.log(`✅ Broadcast deleted from Firebase: ${broadcastId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting broadcast from Firebase:', error);
      throw new Error(`Failed to delete broadcast from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==================== SETTINGS METHODS ====================
  async getSettings(): Promise<any> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot get settings - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }
    try {
      const settingsDoc = await initResult.db.collection('settings').doc('app').get();
      
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        console.log('✅ Retrieved settings from Firebase');
        return {
          id: settingsDoc.id,
          ...data,
          updatedAt: data?.updatedAt?.toDate() || new Date(),
        };
      } else {
        // Return default settings if none exist
        const defaultSettings = {
          profile: {
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '+1234567890'
          },
          notifications: {
            emailNotifications: true,
            pushNotifications: true,
            messageAlerts: true,
            weeklyReports: false
          },
          security: {
            twoFactorAuth: false,
            sessionTimeout: 30
          },
          whatsapp: {
            accessToken: process.env.WHATSAPP_TOKEN || '',
            phoneNumberId: process.env.PHONE_NUMBER_ID || '',
            verifyToken: process.env.VERIFY_TOKEN || '123456',
            webhookUrl: process.env.WEBHOOK_URL || ''
          }
        };
        console.log('✅ No settings found, returning defaults');
        return defaultSettings;
      }
    } catch (error) {
      console.error('❌ Error getting settings from Firebase:', error);
      throw new Error(`Failed to get settings from Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveSettings(settingsData: any): Promise<any> {
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      console.error('❌ Cannot save settings - Firebase not available:', initResult.error);
      throw new Error(`Firebase not available: ${initResult.error}`);
    }
    try {
      await initResult.db.collection('settings').doc('app').set({
        ...settingsData,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('✅ Settings saved to Firebase');
      return {
        id: 'app',
        ...settingsData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error saving settings to Firebase:', error);
      throw new Error(`Failed to save settings to Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
