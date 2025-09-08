'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FlowBuilder from '@/components/flows/FlowBuilder';
import FlowList from '@/components/flows/FlowList';
import { Plus, Search, Filter } from 'lucide-react';
// Removed direct Firebase imports - now using API
import { ChatFlow } from '@/lib/openai';
import toast from 'react-hot-toast';

export default function FlowsPage() {
  const [flows, setFlows] = useState<ChatFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<ChatFlow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [showFlowBuilder, setShowFlowBuilder] = useState(false);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const response = await fetch('/api/flows');
      const data = await response.json();
      
      if (data.success) {
        setFlows(data.flows);
      } else {
        toast.error('Failed to fetch flows');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching flows:', error);
      toast.error('Failed to fetch flows');
      setLoading(false);
    }
  };

  const createNewFlow = async () => {
    try {
      const newFlow = {
        name: 'New Flow',
        triggers: ['hello'],
        response: 'Hello! How can I help you today?',
        isActive: true,
      };

      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFlow),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create flow');
      }
      
      const createdFlow: ChatFlow = data.flow;

      setFlows(prev => [createdFlow, ...prev]);
      setSelectedFlow(createdFlow);
      setShowFlowBuilder(true);
      toast.success('New flow created');
    } catch (error) {
      console.error('Error creating flow:', error);
      toast.error('Failed to create flow');
    }
  };

  const updateFlow = async (flowId: string, updates: Partial<ChatFlow>) => {
    try {
      const response = await fetch('/api/flows', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          ...updates,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update flow');
      }

      setFlows(prev => prev.map(flow =>
        flow.id === flowId ? { ...flow, ...updates, updatedAt: new Date() } : flow
      ));

      if (selectedFlow?.id === flowId) {
        setSelectedFlow(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }

      toast.success('Flow updated successfully');
    } catch (error) {
      console.error('Error updating flow:', error);
      toast.error('Failed to update flow');
    }
  };

  const deleteFlow = async (flowId: string) => {
    try {
      const response = await fetch(`/api/flows?flowId=${flowId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete flow');
      }

      setFlows(prev => prev.filter(flow => flow.id !== flowId));

      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null);
        setShowFlowBuilder(false);
      }

      toast.success('Flow deleted successfully');
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast.error('Failed to delete flow');
    }
  };

  const toggleFlowStatus = async (flowId: string, isActive: boolean) => {
    await updateFlow(flowId, { isActive });
  };

  const filteredFlows = flows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.triggers.some(trigger =>
        trigger.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && flow.isActive) ||
      (filterActive === 'inactive' && !flow.isActive);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Layout title="Flow Builder">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Flow Builder">
        <div className="">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flow Builder</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create and manage automated conversation flows for your WhatsApp chatbot
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={createNewFlow}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Flow
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search flows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Flows</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flow List */}
            <div className="lg:col-span-1">
              <FlowList
                flows={filteredFlows}
                selectedFlow={selectedFlow}
                onSelectFlow={(flow) => {
                  setSelectedFlow(flow);
                  setShowFlowBuilder(true);
                }}
                onToggleStatus={toggleFlowStatus}
                onDeleteFlow={deleteFlow}
              />
            </div>

            {/* Flow Builder */}
            <div className="lg:col-span-2">
              {showFlowBuilder && selectedFlow ? (
                <FlowBuilder
                  flow={selectedFlow}
                  onUpdateFlow={updateFlow}
                  onClose={() => {
                    setShowFlowBuilder(false);
                    setSelectedFlow(null);
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No flow selected
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Select a flow from the list or create a new one to start building
                  </p>
                  <button
                    onClick={createNewFlow}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Flow
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
