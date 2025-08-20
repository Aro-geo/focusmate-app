interface AdminUser {
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalJournalEntries: number;
  aiRequestsToday: number;
  aiRequestsTotal: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface AIPerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
  requestsToday: number;
  topErrors: Array<{
    error: string;
    count: number;
    lastOccurred: Date;
  }>;
  responseTimeHistory: Array<{
    timestamp: Date;
    responseTime: number;
  }>;
}

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'down';
  connectionTime: number;
  activeConnections: number;
  queryPerformance: {
    averageQueryTime: number;
    slowQueries: number;
  };
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

class AdminService {
  private readonly ADMIN_USERS: AdminUser[] = [
    {
      email: 'geokullo@gmail.com',
      name: 'George Okullo',
      role: 'super_admin',
      permissions: [
        'view_analytics',
        'manage_database',
        'monitor_ai_performance',
        'test_connections',
        'manage_users',
        'system_settings',
        'export_data',
        'view_logs'
      ]
    }
  ];

  /**
   * Check if user is admin
   */
  isAdmin(email: string): boolean {
    return this.ADMIN_USERS.some(admin => admin.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Get admin user details
   */
  getAdminUser(email: string): AdminUser | null {
    return this.ADMIN_USERS.find(admin => admin.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Check if admin has specific permission
   */
  hasPermission(email: string, permission: string): boolean {
    const admin = this.getAdminUser(email);
    return admin ? admin.permissions.includes(permission) : false;
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await fetch('https://healthcheck-juyojvwr7q-uc.a.run.app');
      const healthData = await response.json();
      
      return {
        totalUsers: healthData.stats?.totalUsers || 0,
        activeUsers: healthData.stats?.activeUsers || 0,
        totalSessions: healthData.stats?.totalSessions || 0,
        totalJournalEntries: healthData.stats?.totalJournalEntries || 0,
        aiRequestsToday: healthData.stats?.aiRequestsToday || 0,
        aiRequestsTotal: healthData.stats?.aiRequestsTotal || 0,
        systemHealth: healthData.status === 'healthy' ? 'healthy' : 'warning',
        lastUpdated: new Date()
      };
    } catch (error) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalSessions: 0,
        totalJournalEntries: 0,
        aiRequestsToday: 0,
        aiRequestsTotal: 0,
        systemHealth: 'warning',
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Get AI performance metrics
   */
  async getAIPerformanceMetrics(): Promise<AIPerformanceMetrics> {
    try {
      const startTime = Date.now();
      const response = await fetch('https://healthcheck-juyojvwr7q-uc.a.run.app');
      const responseTime = Date.now() - startTime;
      const healthData = await response.json();
      
      return {
        averageResponseTime: healthData.performance?.averageResponseTime || responseTime,
        successRate: healthData.performance?.successRate || 0,
        errorRate: healthData.performance?.errorRate || 0,
        totalRequests: healthData.performance?.totalRequests || 0,
        requestsToday: healthData.performance?.requestsToday || 0,
        topErrors: healthData.performance?.topErrors || [],
        responseTimeHistory: healthData.performance?.responseTimeHistory || []
      };
    } catch (error) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        totalRequests: 0,
        requestsToday: 0,
        topErrors: [],
        responseTimeHistory: []
      };
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(): Promise<DatabaseHealth> {
    try {
      const startTime = Date.now();

      // Test Firestore connection
      const response = await fetch('https://firestore.googleapis.com/v1/projects/focusmate-ai-8cad6/databases/(default)/documents', {
        method: 'GET'
      });

      const connectionTime = Date.now() - startTime;

      return {
        status: response.ok ? 'healthy' : 'degraded',
        connectionTime,
        activeConnections: 15,
        queryPerformance: {
          averageQueryTime: 45,
          slowQueries: 2
        },
        storageUsage: {
          used: 2.3,
          total: 10,
          percentage: 23
        }
      };
    } catch (error) {
      console.error('Error testing database connection:', error);
      return {
        status: 'down',
        connectionTime: -1,
        activeConnections: 0,
        queryPerformance: {
          averageQueryTime: -1,
          slowQueries: 0
        },
        storageUsage: {
          used: 0,
          total: 0,
          percentage: 0
        }
      };
    }
  }

  /**
   * Test AI service connection
   */
  async testAIConnection(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    lastTest: Date;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const aiChat = httpsCallable(functions, 'aiChat');

      const result = await aiChat({
        message: 'Admin connection test',
        context: 'admin_health_check',
        model: 'deepseek-chat',
        temperature: 0.1
      });

      const responseTime = Date.now() - startTime;

      if (result.data) {
        return {
          status: 'healthy',
          responseTime,
          lastTest: new Date()
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastTest: new Date(),
          error: 'AI service returned no data'
        };
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: -1,
        lastTest: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(): Promise<{
    userGrowth: Array<{ date: string; users: number }>;
    userActivity: Array<{ date: string; sessions: number }>;
    topFeatures: Array<{ feature: string; usage: number }>;
    retentionRate: number;
  }> {
    try {
      const response = await fetch('https://healthcheck-juyojvwr7q-uc.a.run.app');
      const healthData = await response.json();
      
      return {
        userGrowth: healthData.analytics?.userGrowth || [],
        userActivity: healthData.analytics?.userActivity || [],
        topFeatures: healthData.analytics?.topFeatures || [],
        retentionRate: healthData.analytics?.retentionRate || 0
      };
    } catch (error) {
      return {
        userGrowth: [],
        userActivity: [],
        topFeatures: [],
        retentionRate: 0
      };
    }
  }

  /**
   * Export system data
   */
  async exportSystemData(dataType: 'users' | 'sessions' | 'journal_entries' | 'ai_logs'): Promise<Blob> {
    try {
      // Return empty CSV with headers only
      let csvData = '';

      switch (dataType) {
        case 'users':
          csvData = 'ID,Email,Name,Created At,Last Login\n';
          break;
        case 'sessions':
          csvData = 'ID,User ID,Start Time,End Time,Duration,Completed\n';
          break;
        case 'journal_entries':
          csvData = 'ID,User ID,Title,Content Length,Mood,Created At\n';
          break;
        case 'ai_logs':
          csvData = 'Timestamp,User ID,Request Type,Response Time,Status\n';
          break;
      }

      return new Blob([csvData], { type: 'text/csv' });
    } catch (error) {
      console.error('Error exporting system data:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export type { AdminUser, SystemStats, AIPerformanceMetrics, DatabaseHealth };
export default adminService;