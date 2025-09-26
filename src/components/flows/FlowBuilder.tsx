'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  MessageSquare,
  Zap,
  Settings
} from 'lucide-react';
import { ChatFlow } from '@/lib/openai';
import toast from 'react-hot-toast';

interface FlowBuilderProps {
  flow: ChatFlow;
  onUpdateFlow: (flowId: string, updates: Partial<ChatFlow>) => void;
  onClose: () => void;
}

export default function FlowBuilder({ flow, onUpdateFlow, onClose }: FlowBuilderProps) {
  const [name, setName] = useState(flow.name);
  const [triggers, setTriggers] = useState<string[]>(flow.triggers);
  const [response, setResponse] = useState(flow.response);
  const [isActive, setIsActive] = useState(flow.isActive);
  const [newTrigger, setNewTrigger] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when flow prop changes
  useEffect(() => {
    setName(flow.name);
    setTriggers(flow.triggers);
    setResponse(flow.response);
    setIsActive(flow.isActive);
    setNewTrigger('');
    setHasChanges(false);
  }, [flow.id]); // Only update when flow ID changes

  useEffect(() => {
    const hasChanges = 
      name !== flow.name ||
      JSON.stringify(triggers) !== JSON.stringify(flow.triggers) ||
      response !== flow.response ||
      isActive !== flow.isActive;
    
    setHasChanges(hasChanges);
  }, [name, triggers, response, isActive, flow]);

  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      toast.error('Flow name is required');
      return;
    }
    
    if (triggers.length === 0) {
      toast.error('At least one trigger is required');
      return;
    }
    
    if (!response.trim()) {
      toast.error('Response message is required');
      return;
    }

    try {
      await onUpdateFlow(flow.id, {
        name: name.trim(),
        triggers,
        response: response.trim(),
        isActive,
      });
      setHasChanges(false);
      toast.success('Flow saved successfully');
    } catch (error) {
      toast.error('Failed to save flow');
    }
  };

  const addTrigger = () => {
    if (newTrigger.trim() && !triggers.includes(newTrigger.trim())) {
      setTriggers([...triggers, newTrigger.trim()]);
      setNewTrigger('');
    }
  };

  const removeTrigger = (index: number) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrigger();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Flow Builder</h2>
              <p className="text-sm text-gray-600">Editing: <span className="font-medium text-green-600">{flow.name}</span></p>
              <p className="text-xs text-gray-500 mt-1">Status: <span className={`font-medium ${flow.isActive ? 'text-green-600' : 'text-red-600'}`}>{flow.isActive ? 'Active' : 'Inactive'}</span></p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Flow Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Flow Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter flow name..."
          />
        </div>

        {/* Triggers */} 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trigger Keywords
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Add keywords or phrases that will trigger this flow when customers send messages
          </p>
          
          <div className="space-y-3">
            {/* Add new trigger */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter trigger keyword..."
              />
              <button
                onClick={addTrigger}
                disabled={!newTrigger.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Existing triggers */}
            {triggers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {triggers.map((trigger, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    <span>{trigger}</span>
                    <button
                      onClick={() => removeTrigger(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Response */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Response Message
          </label>
          <p className="text-sm text-gray-600 mb-3">
            The message that will be sent when this flow is triggered
          </p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your response message..."
          />
          <div className="mt-2 text-sm text-gray-500">
            {response.length} characters
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Flow Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={isActive}
                onChange={() => setIsActive(true)}
                className="w-4 h-4 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!isActive}
                onChange={() => setIsActive(false)}
                className="w-4 h-4 text-gray-600 focus:ring-gray-500"
              />
              <span className="ml-2 text-sm text-gray-700">Inactive</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-500 mb-1">Customer message</div>
              <div className="text-sm text-gray-900">
                {triggers.length > 0 ? `"${triggers[0]}"` : '"Hello"'}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Zap className="w-4 h-4 text-green-500" />
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xs text-green-600 mb-1">Bot response</div>
              <div className="text-sm text-gray-900">
                {response || 'Your response message will appear here...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isActive ? (
              <div className="flex items-center text-green-600">
                <Play className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Active</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <Pause className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Inactive</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || !name.trim() || !response.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {hasChanges ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
