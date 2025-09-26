'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  MessageSquare,
  Workflow,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DashboardStats {
  totalMessages: number;
  activeFlows: number;
  totalUsers: number;
  responseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'flow' | 'broadcast';
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    activeFlows: 0,
    totalUsers: 0,
    responseTime: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent messages
        const messagesQuery = query(
          collection(db, 'conversations'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        const totalMessages = messagesSnapshot.size;

        // Fetch active flows
        const flowsQuery = query(
          collection(db, 'flows'),
          where('isActive', '==', true)
        );
        const flowsSnapshot = await getDocs(flowsQuery);
        const activeFlows = flowsSnapshot.size;

        // Fetch total users (if admin)
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const totalUsers = usersSnapshot.size;

        setStats({
          totalMessages,
          activeFlows,
          totalUsers,
          responseTime: 2.5, // Mock data - calculate from actual response times
        });

        // Mock recent activity data
        setRecentActivity([
          {
            id: '1',
            type: 'message',
            description: 'New message from customer about pricing',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            status: 'success',
          },
          {
            id: '2',
            type: 'flow',
            description: 'Flow "Welcome Message" was updated',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            status: 'success',
          },
          {
            id: '3',
            type: 'broadcast',
            description: 'Broadcast sent to 150 users',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            status: 'success',
          },
          {
            id: '4',
            type: 'message',
            description: 'Failed to send message to user',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            status: 'error',
          },
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'flow':
        return <Workflow className="w-4 h-4" />;
      case 'broadcast':
        return <Users className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Dashboard">
        <div className="space-y-8 -m-6 p-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {userProfile?.displayName || 'User'}! 👋
                </h1>
                <p className="text-green-100 text-lg">
                  Your WhatsApp chatbot is running smoothly. Here's what's happening today.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Messages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Messages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">+12% from last week</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Flows */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Flows</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeFlows}</p>
                  <p className="text-xs text-green-600 mt-1">All systems running</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Workflow className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">+8% from last month</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.responseTime}s</p>
                  <p className="text-xs text-orange-600 mt-1">Fast response time</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                    View All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusIcon(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Message Success Rate</span>
                  <span className="text-sm font-semibold text-green-600">98.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Accuracy</span>
                  <span className="text-sm font-semibold text-blue-600">94.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-semibold text-purple-600">99.9%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                </div>
              </div>
            </div>
          </div>


          {/* Quick Actions & System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group">
                  <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Create New Flow</span>
                </button>
                <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Send Broadcast</span>
                </button>
                <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors group">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">View Analytics</span>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">WhatsApp API</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Webhook Server</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">AI Service</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Database</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Usage */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Messages this month</span>
                    <span className="font-semibold">1,250 / 10,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full" style={{ width: '12.5%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">8,750 messages remaining</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Active flows</span>
                    <span className="font-semibold">{stats.activeFlows} / 50</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-2.5 rounded-full" style={{ width: `${(stats.activeFlows / 50) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{50 - stats.activeFlows} flows remaining</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Plan</span>
                    <span className="text-sm font-semibold text-green-600">{userProfile?.plan?.toUpperCase() || 'FREE'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
