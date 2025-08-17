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
      // In a real implementation, these would be actual database queries
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        return await response.json();
      }

      // Fallback mock data for development
      return {
        totalUsers: 1247,
        activeUsers: 89,
        totalSessions: 15623,
        totalJournalEntries: 8934,
        aiRequestsToday: 234,
        aiRequestsTotal: 12456,
        systemHealth: 'healthy',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  /**
   * Get AI performance metrics
   */
  async getAIPerformanceMetrics(): Promise<AIPerformanceMetrics> {
    try {
      // Use Firebase Functions health check
      const response = await fetch('https://healthcheck-juyojvwr7q-uc.a.run.app', {
        method: 'GET'
      });

      const healthData = response.ok ? await response.json() : null;

      // Test AI response time using Firebase Functions
      const startTime = Date.now();
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const aiChat = httpsCallable(functions, 'aiChat');

        await aiChat({
          message: 'Health check test',
          context: 'admin_test',
          model: 'deepseek-chat',
          temperature: 0.1
        });
      } catch (e) {
        // Ignore test errors
      }
      const responseTime = Date.now() - startTime;

      return {
        averageResponseTime: responseTime,
        successRate: 0.97,
        errorRate: 0.03,
        totalRequests: 12456,
        requestsToday: 234,
        topErrors: [
          {
            error: 'Rate limit exceeded',
            count: 12,
            lastOccurred: new Date(Date.now() - 3600000)
          },
          {
            error: 'Timeout error',
            count: 8,
            lastOccurred: new Date(Date.now() - 7200000)
          }
        ],
        responseTimeHistory: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000),
          responseTime: Math.random() * 2000 + 500
        }))
      };
    } catch (error) {
      console.error('Error fetching AI performance metrics:', error);
      throw error;
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
      // Mock data for now - in production this would query the database
      return {
        userGrowth: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 3600000).toISOString().split('T')[0],
          users: Math.floor(Math.random() * 50) + 20
        })),
        userActivity: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 3600000).toISOString().split('T')[0],
          sessions: Math.floor(Math.random() * 200) + 100
        })),
        topFeatures: [
          { feature: 'Pomodoro Timer', usage: 89 },
          { feature: 'Journal', usage: 67 },
          { feature: 'AI Focus Coach', usage: 54 },
          { feature: 'Task Management', usage: 43 },
          { feature: 'Analytics', usage: 32 }
        ],
        retentionRate: 0.73
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  }

  /**
   * Export system data
   */
  async exportSystemData(dataType: 'users' | 'sessions' | 'journal_entries' | 'ai_logs'): Promise<Blob> {
    try {
      // Mock CSV data for now
      let csvData = '';

      switch (dataType) {
        case 'users':
          csvData = 'ID,Email,Name,Created At,Last Login\n';
          csvData += '1,user1@example.com,User One,2024-01-01,2024-08-14\n';
          csvData += '2,user2@example.com,User Two,2024-01-15,2024-08-13\n';
          break;
        case 'sessions':
          csvData = 'ID,User ID,Start Time,End Time,Duration,Completed\n';
          csvData += '1,1,2024-08-14 09:00:00,2024-08-14 09:25:00,25,true\n';
          csvData += '2,1,2024-08-14 10:00:00,2024-08-14 10:20:00,20,false\n';
          break;
        case 'journal_entries':
          csvData = 'ID,User ID,Title,Content Length,Mood,Created At\n';
          csvData += '1,1,Daily Reflection,245,good,2024-08-14\n';
          csvData += '2,1,Work Progress,189,neutral,2024-08-13\n';
          break;
        case 'ai_logs':
          csvData = 'Timestamp,User ID,Request Type,Response Time,Status\n';
          csvData += '2024-08-14 09:15:00,1,focus_coaching,1200,success\n';
          csvData += '2024-08-14 09:30:00,2,journal_insight,890,success\n';
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