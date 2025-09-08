'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  User
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  timestamp: Date | string;
  from: string;
  contactName: string;
  type: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

interface Chat {
  id: string;
  phoneNumber: string;
  contactName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'resolved' | 'pending';
}

const ChatsPage: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  
  // Ref for messages container to enable auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Initialize Socket.io connection
  useEffect(() => {
    console.log('🔌 Initializing Socket.io connection...');
    const newSocket = io('http://localhost:3000', {
      path: '/api/socketio'
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket.io connected successfully:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
    });

    newSocket.on('apiData', (messageData: any) => {
      console.log('Received message via Socket.io:', messageData);
      
      // Update messages for the current chat
      if (selectedChat && messageData.from === selectedChat.phoneNumber) {
        setMessages(prev => [...prev, {
          id: messageData.id,
          text: messageData.text,
          timestamp: new Date(messageData.timestamp),
          from: messageData.direction === 'outbound' ? 'system' : messageData.from,
          contactName: messageData.contactName,
          type: messageData.type,
          status: messageData.direction === 'outbound' ? 'delivered' : undefined
        }]);
      }

      // Update chats list
      setChats(prev => {
        const existingChatIndex = prev.findIndex(chat => chat.phoneNumber === messageData.from);
        
        if (existingChatIndex !== -1) {
          // Update existing chat
          const updatedChats = [...prev];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            lastMessage: messageData.text,
            lastMessageTime: new Date(messageData.timestamp),
            unreadCount: selectedChat?.phoneNumber === messageData.from ? 0 : updatedChats[existingChatIndex].unreadCount + 1
          };
          return updatedChats;
        } else {
          // Add new chat
          const newChat: Chat = {
            id: messageData.from,
            phoneNumber: messageData.from,
            contactName: messageData.contactName,
            lastMessage: messageData.text,
            lastMessageTime: new Date(messageData.timestamp),
            unreadCount: 1,
            status: 'active'
          };
          return [newChat, ...prev];
        }
      });
    });

    return () => {
      newSocket.close();
    };
  }, [selectedChat]);

  // Load chats from API
  useEffect(() => {
    const loadChats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/contacts');
        const data = await response.json();
        
        if (data.success && data.contacts) {
          const chatList: Chat[] = data.contacts.map((contact: any) => ({
            id: contact.waId,
            phoneNumber: contact.waId,
            contactName: contact.contactName,
            lastMessage: contact.lastMessage,
            lastMessageTime: new Date(contact.lastMessageAt),
            unreadCount: 0,
            status: 'active'
          }));
          
          setChats(chatList);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  // Check webhook configuration
  useEffect(() => {
    const checkWebhook = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();
        setWebhookConfigured(data.config?.hasAccessToken && data.config?.hasPhoneNumberId);
      } catch (error) {
        console.error('Error checking webhook:', error);
      }
    };

    checkWebhook();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    const message: Message = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date(),
      from: 'system', // This is from us
      contactName: 'You',
      type: 'text',
      status: 'sent'
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedChat.phoneNumber,
          message: messageText
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update message status
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'delivered' } : msg
        ));
      } else {
        // Update message status to failed
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'failed' } : msg
        ));
        console.error('Failed to send message:', result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  const loadChatHistory = async (chat: Chat) => {
    setSelectedChat(chat);
    setMessages([]);
    
    try {
      // Load chat history from Firebase
      const response = await fetch(`http://localhost:3000/api/chat-history/${chat.phoneNumber}?limit=50`);
      const data = await response.json();
      
      if (data.success && data.messages) {
        // FIXED: Correct timestamp parsing - Firebase already returns Date objects
        const firebaseMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(), // ✅ Fixed timestamp parsing
          from: msg.direction === 'outbound' ? 'system' : msg.from,
          contactName: msg.contactName,
          type: msg.type,
          status: msg.direction === 'outbound' ? 'delivered' : undefined
        }));
        
        setMessages(firebaseMessages);
        // Auto-scroll to bottom after loading messages (immediate scroll)
        setTimeout(() => scrollToBottom(false), 100);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const filteredChats = chats.filter(chat =>
    chat.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.phoneNumber.includes(searchTerm)
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCircle className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout title="Chats">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading chats...</div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Chats">
        <div className="h-[90vh] flex flex-col">
          
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Chat List */}
            <div className="w-1/4 border-r border-gray-200 bg-white flex flex-col min-h-0">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Chat List Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Conversations</h2>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400 cursor-pointer" />
                    <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Chat Items */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredChats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No conversations found
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedChat?.id === chat.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                      }`}
                      onClick={() => loadChatHistory(chat)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.contactName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(chat.lastMessageTime)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate max-w-[200px]">
                          {chat.lastMessage.length > 30 
                            ? `${chat.lastMessage.substring(0, 30)}...` 
                            : chat.lastMessage
                          }
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-h-0 max-h-screen">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{selectedChat.contactName}</h3>
                          <p className="text-sm text-gray-500">{selectedChat.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {selectedChat.status}
                        </span>
                        <Phone className="w-4 h-4 text-gray-400 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-[calc(100vh-200px)]">
                    {messages.map((message) => {
                      // Determine message type and styling
                      const isOutbound = message.from === 'system' || message.contactName?.includes('Bot Reply');
                      const isAutoReply = message.contactName?.includes('Bot Reply');
                      const isCustomMessage = message.from === 'system' && !isAutoReply;
                      const isCustomerMessage = !isOutbound;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-3`}
                        >
                          <div className={`max-w-xs lg:max-w-md ${isOutbound ? 'ml-12' : 'mr-12'} break-words`}>
                            {/* Profile name */}
                            <div className={`text-xs text-gray-500 mb-1 ${isOutbound ? 'text-right' : 'text-left'}`}>
                              {message.contactName || (isOutbound ? 'You' : 'Customer')}
                            </div>
                            
                            {/* Message bubble */}
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isAutoReply
                                  ? 'bg-blue-500 text-white' // Auto-replies: Blue
                                  : isCustomMessage
                                  ? 'bg-green-500 text-white' // Custom messages: Green
                                  : 'bg-gray-200 text-gray-900' // Customer messages: Gray
                              }`}
                            >
                              <p className="text-sm break-words whitespace-pre-wrap">
                                {message.text.length > 200 
                                  ? `${message.text.substring(0, 200)}...` 
                                  : message.text
                                }
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs ${isOutbound ? 'opacity-70' : 'text-gray-500'}`}>
                                  {formatTime(new Date(message.timestamp))}
                                </span>
                                {isOutbound && (
                                  <div className="ml-2">
                                    {getStatusIcon(message.status)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Scroll target for auto-scroll */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500" // ✅ Fixed text color
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ChatsPage;
