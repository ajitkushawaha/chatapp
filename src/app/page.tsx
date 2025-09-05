'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  timestamp: string | Date;
  from?: string;
  contactName?: string;
  type?: string;
}

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  webhookUrl: string;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig>({
    accessToken: '',
    phoneNumberId: '',
    verifyToken: '123456',
    webhookUrl: ''
  });

  // Load configuration from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedConfig = localStorage.getItem('whatsapp-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = (newConfig: WhatsAppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('whatsapp-config', JSON.stringify(newConfig));
    setShowConfig(false);
  };

  // Update webhook configuration on server
  const updateWebhookConfig = async (newConfig: WhatsAppConfig) => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      
      if (response.ok) {
        console.log('Configuration updated successfully');
      } else {
        console.error('Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
    }
  };

  useEffect(() => {
    // Only initialize socket on client side
    if (typeof window === 'undefined') return;

    let socketInstance: Socket | null = null;
    let connectionTimeout: NodeJS.Timeout;

    try {
      // Initialize Socket.io connection to webhook server
      socketInstance = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Set a timeout for connection
      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          console.warn('Socket connection timeout');
          setIsLoading(false);
        }
      }, 10000);

      socketInstance.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        setIsLoading(false);
        clearTimeout(connectionTimeout);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        setIsLoading(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        setIsLoading(false);
      });

      // Listen for WhatsApp messages
      socketInstance.on('apiData', (messageData: Message) => {
        // The webhook server sends a complete message object
        setMessages(prev => [...prev, messageData]);
      });

      // Listen for regular chat messages
      socketInstance.on('message', (data: { text: string }) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: data.text,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
      });

      setSocket(socketInstance);
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setIsConnected(false);
      setIsLoading(false);
    }

    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (socketInstance) {
        socketInstance.close();
      }
    };
  }, []);

  const sendMessage = (text: string) => {
    if (socket && text.trim()) {
      socket.emit('message', { text: text.trim() });
    }
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    updateWebhookConfig(config);
  };

  const ConfigModal = () => {
    if (!showConfig) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-xl font-bold mb-4">WhatsApp Cloud API Configuration</h3>
          
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <input
                type="password"
                value={config.accessToken}
                onChange={(e) => setConfig({...config, accessToken: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your WhatsApp access token"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={config.phoneNumberId}
                onChange={(e) => setConfig({...config, phoneNumberId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your phone number ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verify Token
              </label>
              <input
                type="text"
                value={config.verifyToken}
                onChange={(e) => setConfig({...config, verifyToken: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter verify token"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://your-domain.com/api/webhook"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Save Configuration
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Test chat app
              </h1>
              <h2 className="text-2xl font-semibold text-green-600">
                Live WhatsApp Cloud
              </h2>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setShowConfig(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isLoading ? 'bg-yellow-500 animate-pulse' : 
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isLoading ? 'Connecting...' : 
               isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Messages Area */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Send a WhatsApp message to see it here!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800">{message.text}</p>
                        {message.contactName && (
                          <p className="text-xs text-gray-600 mt-1">
                            From: {message.contactName} ({message.from})
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a test message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    sendMessage(input.value);
                    input.value = '';
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              How to use:
            </h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Click the <strong>Settings</strong> button to configure your WhatsApp Cloud API</li>
              <li>• Enter your Access Token, Phone Number ID, and Verify Token</li>
              <li>• Set your webhook URL: <code className="bg-blue-100 px-2 py-1 rounded">{config.webhookUrl || 'your-domain.com/api/webhook'}</code></li>
              <li>• Send messages to your WhatsApp Business number</li>
              <li>• Watch them appear here in real-time!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigModal />
    </main>
  );
}