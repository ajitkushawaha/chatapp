'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Megaphone, 
  Plus, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Edit,
  Trash2
} from 'lucide-react';

interface Broadcast {
  id: string;
  name: string;
  message: string;
  recipients: any[];
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledFor?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  results?: {
    total: number;
    sent: number;
    failed: number;
    errors: any[];
  };
}

const BroadcastsPage: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    name: '',
    message: '',
    recipients: ''
  });

  // Fetch broadcasts from API
  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/broadcasts');
      const data = await response.json();
      
      if (data.success) {
        setBroadcasts(data.broadcasts);
      } else {
        console.error('Failed to fetch broadcasts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load broadcasts on component mount
  React.useEffect(() => {
    fetchBroadcasts();
  }, []);

  const filteredBroadcasts = broadcasts.filter(broadcast =>
    broadcast.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broadcast.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Edit className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateBroadcast = async () => {
    if (!newBroadcast.name || !newBroadcast.message) return;

    try {
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBroadcast.name,
          message: newBroadcast.message,
          recipients: []
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewBroadcast({ name: '', message: '', recipients: '' });
        setShowCreateModal(false);
        fetchBroadcasts(); // Refresh the list
      } else {
        console.error('Failed to create broadcast:', data.error);
        alert('Failed to create broadcast: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating broadcast:', error);
      alert('Error creating broadcast');
    }
  };

  const handleSendBroadcast = async (id: string) => {
    if (!confirm('Are you sure you want to send this broadcast to all contacts?')) {
      return;
    }

    try {
      const response = await fetch('/api/broadcasts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcastId: id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Broadcast sent successfully! ${data.message}`);
        fetchBroadcasts(); // Refresh the list
      } else {
        console.error('Failed to send broadcast:', data.error);
        alert('Failed to send broadcast: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('Error sending broadcast');
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) {
      return;
    }

    try {
      const response = await fetch(`/api/broadcasts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchBroadcasts(); // Refresh the list
      } else {
        console.error('Failed to delete broadcast:', data.error);
        alert('Failed to delete broadcast: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      alert('Error deleting broadcast');
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Broadcasts">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broadcast Messages</h1>
              <p className="mt-1 text-sm text-gray-600">
                Send messages to multiple customers at once.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search broadcasts..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
                <Filter size={18} className="mr-2" /> Filter
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Plus size={18} className="mr-2" /> New Broadcast
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Megaphone className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Broadcasts</p>
                  <p className="text-2xl font-bold text-gray-900">{broadcasts.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {broadcasts.filter(b => b.status === 'sent').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {broadcasts.filter(b => b.status === 'draft').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {broadcasts.reduce((sum, b) => sum + (b.results?.total || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Broadcasts List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Broadcasts</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p>Loading broadcasts...</p>
                </div>
              ) : filteredBroadcasts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No broadcasts yet</p>
                  <p>Create your first broadcast message to get started.</p>
                </div>
              ) : (
                filteredBroadcasts.map((broadcast) => (
                  <div key={broadcast.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{broadcast.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(broadcast.status)}`}>
                            {broadcast.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{broadcast.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {broadcast.results?.total || 0} recipients
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {broadcast.sentAt ? broadcast.sentAt.toLocaleString() : 'Not sent yet'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {broadcast.status === 'draft' && (
                          <button
                            onClick={() => handleSendBroadcast(broadcast.id)}
                            className="flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </button>
                        )}
                        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-md">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBroadcast(broadcast.id)}
                          className="p-2 text-gray-500 hover:text-red-700 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Create Broadcast Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Broadcast</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Broadcast Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    value={newBroadcast.name}
                    onChange={(e) => setNewBroadcast(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter broadcast name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    rows={4}
                    value={newBroadcast.message}
                    onChange={(e) => setNewBroadcast(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your message"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients (optional)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    value={newBroadcast.recipients}
                    onChange={(e) => setNewBroadcast(prev => ({ ...prev, recipients: e.target.value }))}
                    placeholder="Number of recipients"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBroadcast}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Create Broadcast
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default BroadcastsPage;
