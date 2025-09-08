'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ChatFlow } from '@/lib/openai';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Utility function to safely convert timestamps to Date objects
const safeDate = (timestamp: any): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    // Handle Firestore timestamp objects
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(); // Fallback to current date
};

interface FlowListProps {
  flows: ChatFlow[];
  selectedFlow: ChatFlow | null;
  onSelectFlow: (flow: ChatFlow) => void;
  onToggleStatus: (flowId: string, isActive: boolean) => void;
  onDeleteFlow: (flowId: string) => void;
}

export default function FlowList({ 
  flows, 
  selectedFlow, 
  onSelectFlow, 
  onToggleStatus, 
  onDeleteFlow 
}: FlowListProps) {
  const handleToggleStatus = async (flow: ChatFlow) => {
    try {
      await onToggleStatus(flow.id, !flow.isActive);
    } catch (error) {
      toast.error('Failed to update flow status');
    }
  };

  const handleDeleteFlow = async (flow: ChatFlow) => {
    if (window.confirm(`Are you sure you want to delete "${flow.name}"?`)) {
      try {
        await onDeleteFlow(flow.id);
      } catch (error) {
        toast.error('Failed to delete flow');
      }
    }
  };

  if (flows.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flows found</h3>
          <p className="text-gray-600">
            Create your first flow to get started with automated conversations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Your Flows</h2>
        <p className="text-sm text-gray-600">{flows.length} total flows</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedFlow?.id === flow.id
                ? 'bg-green-50 border-r-4 border-green-500'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectFlow(flow)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {flow.name}
                  </h3>
                  {flow.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                  <span className="flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {flow.triggers.length} triggers
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(safeDate(flow.updatedAt), { addSuffix: true })}
                  </span>
                </div>

                {flow.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {flow.triggers.slice(0, 3).map((trigger, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {trigger}
                      </span>
                    ))}
                    {flow.triggers.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{flow.triggers.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(flow);
                  }}
                  className={`p-1 rounded transition-colors ${
                    flow.isActive
                      ? 'text-green-600 hover:bg-green-100'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={flow.isActive ? 'Deactivate flow' : 'Activate flow'}
                >
                  {flow.isActive ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFlow(flow);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Edit flow"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFlow(flow);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Delete flow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
