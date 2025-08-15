import subscriptionService from './SubscriptionService';
import aiService from './AIService';
import { adminService } from './AdminService';
import { firebaseService } from './FirebaseService';

/**
 * Wrapper for AI services that enforces subscription limits
 */
class AIServiceWrapper {
  private aiService: any;

  constructor() {
    this.aiService = aiService;
  }

  /**
   * Check if user is admin
   */
  private async isAdminUser(userId: string): Promise<boolean> {
    try {
      // Import auth here to avoid circular dependencies
      const { auth } = await import('../firebase');
      
      // Check if current user is the admin user
      if (auth.currentUser && auth.currentUser.uid === userId && auth.currentUser.email) {
        return adminService.isAdmin(auth.currentUser.email);
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Check if user can make AI request and record usage
   */
  private async checkAndRecordUsage(userId: string): Promise<boolean> {
    try {
      // Admin users always have access
      if (await this.isAdminUser(userId)) {
        return true;
      }

      const canAccess = await subscriptionService.canAccessAIFeatures(userId);
      
      if (!canAccess) {
        return false;
      }

      const recorded = await subscriptionService.recordAIRequest(userId);
      return recorded;
    } catch (error) {
      console.error('Error checking AI usage:', error);
      return false;
    }
  }

  /**
   * Generate AI response with subscription check
   */
  async generateResponse(userId: string, prompt: string, context?: any): Promise<string> {
    const canUse = await this.checkAndRecordUsage(userId);
    
    if (!canUse) {
      const isTrialExpired = await subscriptionService.isTrialExpired(userId);
      
      if (isTrialExpired) {
        return "Your trial has expired. Please upgrade to Pro to continue using AI features. Contact us at focusmate-ai@hotmail.com to upgrade.";
      } else {
        const remaining = await subscriptionService.getAIRequestsRemaining(userId);
        return `You've reached your daily AI request limit. You have ${remaining} requests remaining today. Upgrade to Pro for unlimited requests.`;
      }
    }

    try {
      return await this.aiService.generateResponse(prompt, context);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing your request right now. Please try again later.";
    }
  }

  /**
   * Analyze task with subscription check
   */
  async analyzeTask(userId: string, task: any): Promise<any> {
    const canUse = await this.checkAndRecordUsage(userId);
    
    if (!canUse) {
      return {
        error: true,
        message: "AI analysis requires a Pro subscription. Upgrade to unlock smart task insights."
      };
    }

    try {
      return await this.aiService.analyzeTask(task);
    } catch (error) {
      console.error('Error analyzing task:', error);
      return {
        error: true,
        message: "Unable to analyze task at the moment. Please try again later."
      };
    }
  }

  /**
   * Generate productivity insights with subscription check
   */
  async generateProductivityInsights(userId: string, data: any): Promise<any> {
    const canUse = await this.checkAndRecordUsage(userId);
    
    if (!canUse) {
      return {
        insights: [],
        message: "Advanced insights require a Pro subscription. Upgrade to unlock detailed productivity analysis."
      };
    }

    try {
      return await this.aiService.generateProductivityInsights(data);
    } catch (error) {
      console.error('Error generating productivity insights:', error);
      return {
        insights: [],
        message: "Unable to generate insights at the moment. Please try again later."
      };
    }
  }

  /**
   * Generate focus session feedback with subscription check
   */
  async generateFocusSessionFeedback(userId: string, sessionData: any): Promise<string> {
    const canUse = await this.checkAndRecordUsage(userId);
    
    if (!canUse) {
      return "AI feedback requires a Pro subscription. Upgrade to get personalized session insights and recommendations.";
    }

    try {
      return await this.aiService.generateFocusSessionFeedback(sessionData);
    } catch (error) {
      console.error('Error generating focus session feedback:', error);
      return "Unable to provide feedback at the moment. Please try again later.";
    }
  }

  /**
   * Chat with AI assistant with subscription check
   */
  async chatWithAssistant(userId: string, message: string, context?: any): Promise<string> {
    const canUse = await this.checkAndRecordUsage(userId);
    
    if (!canUse) {
      const remaining = await subscriptionService.getAIRequestsRemaining(userId);
      const isTrialExpired = await subscriptionService.isTrialExpired(userId);
      
      if (isTrialExpired) {
        return "Your trial has expired. Upgrade to Pro to continue chatting with your AI assistant. Contact focusmate-ai@hotmail.com to upgrade.";
      } else {
        return `You've used all your AI requests for today. You'll get ${await subscriptionService.getSubscriptionLimits(userId).then(l => l.aiRequestsPerDay)} more requests tomorrow, or upgrade to Pro for unlimited access.`;
      }
    }

    try {
      return await this.aiService.chatWithAssistant(message, context);
    } catch (error) {
      console.error('Error chatting with assistant:', error);
      return "I'm having trouble responding right now. Please try again in a moment.";
    }
  }

  /**
   * Check if user can access advanced AI features
   */
  async canAccessAdvancedFeatures(userId: string): Promise<boolean> {
    try {
      // Admin users always have access to advanced features
      if (await this.isAdminUser(userId)) {
        return true;
      }

      const subscription = await subscriptionService.getUserSubscription(userId);
      return subscription?.features?.advancedAnalytics || false;
    } catch (error) {
      console.error('Error checking advanced features access:', error);
      return false;
    }
  }

  /**
   * Get user's AI usage stats
   */
  async getUsageStats(userId: string): Promise<{
    requestsUsed: number;
    requestsLimit: number;
    requestsRemaining: number;
    resetTime: string;
  }> {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      const remaining = await subscriptionService.getAIRequestsRemaining(userId);
      
      return {
        requestsUsed: subscription?.aiRequestsUsed || 0,
        requestsLimit: subscription?.aiRequestsLimit || 10,
        requestsRemaining: remaining,
        resetTime: "24 hours"
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        requestsUsed: 0,
        requestsLimit: 10,
        requestsRemaining: 10,
        resetTime: "24 hours"
      };
    }
  }
}

// Create singleton instance
const aiServiceWrapper = new AIServiceWrapper();

export default aiServiceWrapper;
export { AIServiceWrapper };