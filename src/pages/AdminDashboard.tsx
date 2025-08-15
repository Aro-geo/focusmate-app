import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Database,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  Server,
  Zap,
  BarChart3,
  Settings,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { adminService, SystemStats, AIPerformanceMetrics, DatabaseHealth } from '../services/AdminService';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ai' | 'database' | 'connections'>('overview');
  
  // Data states
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIPerformanceMetrics | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<any>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);

  // Check admin authorization
  useEffect(() => {
    if (user?.email) {
      const isAdmin = adminService.isAdmin(user.email);
      setIsAuthorized(isAdmin);
      if (!isAdmin) {
        setLoading(false);
      }
    }
  }, [user]);

  // Load admin data
  useEffect(() => {
    if (isAuthorized) {
      loadAdminData();
    }
  }, [isAuthorized]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [stats, metrics, health, aiStatus, analytics] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getAIPerformanceMetrics(),
        adminService.testDatabaseConnection(),
        adminService.testAIConnection(),
        adminService.getUserAnalytics()
      ]);

      setSystemStats(stats);
      setAiMetrics(metrics);
      setDbHealth(health);
      setAiConnectionStatus(aiStatus);
      setUserAnalytics(analytics);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (dataType: 'users' | 'sessions' | 'journal_entries' | 'ai_logs') => {
    try {
      const blob = await adminService.exportSystemData(dataType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const testConnection = async (type: 'ai' | 'database') => {
    try {
      if (type === 'ai') {
        const status = await adminService.testAIConnection();
        setAiConnectionStatus(status);
      } else {
        const health = await adminService.testDatabaseConnection();
        setDbHealth(health);
      }
    } catch (error) {
      console.error(`Error testing ${type} connection:`, error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={darkMode ? 'text-white' : 'text-gray-900'}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Access Denied
          </h1>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': case 'degraded': return 'text-yellow-500';
      case 'critical': case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': case 'degraded': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': case 'down': return <AlertTriangle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Admin Dashboard
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Welcome back, {adminService.getAdminUser(user?.email || '')?.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadAdminData}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'ai', label: 'AI Performance', icon: Brain },
              { id: 'database', label: 'Database', icon: Database },
              { id: 'connections', label: 'Connections', icon: Server }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? `border-indigo-500 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`
                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Total Users
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {systemStats?.totalUsers.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Active Users
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {systemStats?.activeUsers.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <div className="flex items-center">
                  <Brain className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      AI Requests Today
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {systemStats?.aiRequestsToday.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <div className="flex items-center">
                  <div className={`flex items-center ${getStatusColor(systemStats?.systemHealth || 'unknown')}`}>
                    {getStatusIcon(systemStats?.systemHealth || 'unknown')}
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      System Health
                    </p>
                    <p className={`text-2xl font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {systemStats?.systemHealth || 'Unknown'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => testConnection('ai')}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 border-dashed transition-colors ${
                    darkMode 
                      ? 'border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-indigo-400' 
                      : 'border-gray-300 hover:border-indigo-500 text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Test AI
                </button>
                <button
                  onClick={() => testConnection('database')}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 border-dashed transition-colors ${
                    darkMode 
                      ? 'border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-indigo-400' 
                      : 'border-gray-300 hover:border-indigo-500 text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <Database className="h-5 w-5 mr-2" />
                  Test DB
                </button>
                <button
                  onClick={() => handleExportData('users')}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 border-dashed transition-colors ${
                    darkMode 
                      ? 'border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-indigo-400' 
                      : 'border-gray-300 hover:border-indigo-500 text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export Users
                </button>
                <button
                  onClick={() => handleExportData('ai_logs')}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 border-dashed transition-colors ${
                    darkMode 
                      ? 'border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-indigo-400' 
                      : 'border-gray-300 hover:border-indigo-500 text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Export Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && aiMetrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Response Time
                </h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {aiMetrics.averageResponseTime}ms
                </p>
              </div>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Success Rate
                </h3>
                <p className={`text-3xl font-bold text-green-500`}>
                  {(aiMetrics.successRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Requests Today
                </h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {aiMetrics.requestsToday.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Top Errors */}
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Errors
              </h3>
              <div className="space-y-3">
                {aiMetrics.topErrors.map((error, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {error.error}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {error.count} occurrences
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {error.lastOccurred.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && dbHealth && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Status
                  </h3>
                  <div className={`flex items-center ${getStatusColor(dbHealth.status)}`}>
                    {getStatusIcon(dbHealth.status)}
                  </div>
                </div>
                <p className={`text-2xl font-bold capitalize mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {dbHealth.status}
                </p>
              </div>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Connection Time
                </h3>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {dbHealth.connectionTime}ms
                </p>
              </div>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Storage Used
                </h3>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {dbHealth.storageUsage.percentage}%
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {dbHealth.storageUsage.used}GB / {dbHealth.storageUsage.total}GB
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Connection */}
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Service
                  </h3>
                  <button
                    onClick={() => testConnection('ai')}
                    className={`px-3 py-1 rounded text-sm ${
                      darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    Test
                  </button>
                </div>
                {aiConnectionStatus && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Status:</span>
                      <div className={`flex items-center ${getStatusColor(aiConnectionStatus.status)}`}>
                        {getStatusIcon(aiConnectionStatus.status)}
                        <span className="ml-1 capitalize">{aiConnectionStatus.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Response Time:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {aiConnectionStatus.responseTime}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Last Test:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {aiConnectionStatus.lastTest.toLocaleTimeString()}
                      </span>
                    </div>
                    {aiConnectionStatus.error && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded">
                        <span className="text-red-600 dark:text-red-400 text-sm">
                          {aiConnectionStatus.error}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Database Connection */}
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Database
                  </h3>
                  <button
                    onClick={() => testConnection('database')}
                    className={`px-3 py-1 rounded text-sm ${
                      darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    Test
                  </button>
                </div>
                {dbHealth && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Status:</span>
                      <div className={`flex items-center ${getStatusColor(dbHealth.status)}`}>
                        {getStatusIcon(dbHealth.status)}
                        <span className="ml-1 capitalize">{dbHealth.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Connection Time:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {dbHealth.connectionTime}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Active Connections:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {dbHealth.activeConnections}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;