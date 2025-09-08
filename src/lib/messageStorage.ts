// Simple in-memory message storage
// This will be replaced with Firebase later

interface StoredMessage {
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

interface StoredContact {
  waId: string;
  contactName: string;
  profileName?: string;
  lastMessage: string;
  lastMessageAt: Date;
  messageCount: number;
}

// In-memory storage
const messages: { [waId: string]: StoredMessage[] } = {};
const contacts: { [waId: string]: StoredContact } = {};

export class MessageStorage {
  // Save a message
  static saveMessage(message: StoredMessage) {
    const waId = message.from;
    
    // Initialize messages array for this contact if it doesn't exist
    if (!messages[waId]) {
      messages[waId] = [];
    }
    
    // Add message to storage
    messages[waId].push(message);
    
    // Update contact info
    contacts[waId] = {
      waId,
      contactName: message.contactName,
      profileName: message.contactName,
      lastMessage: message.text,
      lastMessageAt: message.timestamp,
      messageCount: messages[waId].length
    };
    
    console.log(`Message saved for ${waId}:`, message.text);
  }
  
  // Get messages for a contact
  static getMessages(waId: string, limit: number = 50): StoredMessage[] {
    const contactMessages = messages[waId] || [];
    return contactMessages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }
  
  // Get all contacts
  static getContacts(): StoredContact[] {
    return Object.values(contacts).sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }
  
  // Get contact info
  static getContact(waId: string): StoredContact | null {
    return contacts[waId] || null;
  }
  
  // Get message count for a contact
  static getMessageCount(waId: string): number {
    return messages[waId]?.length || 0;
  }
}
