import { firebaseService } from './FirebaseService';
import { adminService } from './AdminService';

export interface UserSubscription {
  id: string;
  userId: string;
  plan: 'trial' | 'basic' | 'pro' | 'team';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  trialUsed: boolean;
  aiRequestsUsed: number;
  aiRequestsLimit: number;
  features: {
    aiCoach: boolean;
    advancedAnalytics: boolean;
    smartInsights: boolean;
    prioritySupport: boolean;
    teamCollaboration: boolean;
    adminDashboard: boolean;
  };
}

export interface SubscriptionLimits {
  aiRequestsPerDay: number;
  aiRequestsPerMonth: number;
  journalInsights: boolean;
  advancedFeatures: boolean;
  prioritySupport: boolean;
}

class SubscriptionService {
  private readonly TRIAL_DURATION_DAYS = 90;
  private readonly BASIC_AI_REQUESTS_PER_DAY = 10;
  private readonly PRO_AI_REQUESTS_PER_DAY = 100;

  /**
   * Initialize subscription for a new user
   */
  async initializeUserSubscription(userId: string): Promise<UserSubscription> {
    try {
      // Admin users get admin subscription
      if (await this.isAdminUser(userId)) {
        return this.getAdminSubscription(userId);
      }

      const now = new Date();
      const trialEndDate = new Date(now.getTime() + (this.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000));

      const subscription: UserSubscription = {
        id: `sub_${userId}_${Date.now()}`,
        userId,
        plan: 'trial',
        status: 'active',
        startDate: now,
        endDate: trialEndDate,
        trialUsed: false,
        aiRequestsUsed: 0,
        aiRequestsLimit: this.PRO_AI_REQUESTS_PER_DAY, // Full access during trial
        features: {
          aiCoach: true,
          advancedAnalytics: true,
          smartInsights: true,
          prioritySupport: true,
          teamCollaboration: false,
          adminDashboard: false
        }
      };

      // Save to Firebase
      await firebaseService.saveUserSubscription(userId, subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error initializing user subscription:', error);
      
      // If it's a permissions error and user is admin, return admin subscription
      if (error instanceof Error && error.message.includes('permissions') && await this.isAdminUser(userId)) {
        return this.getAdminSubscription(userId);
      }
      
      throw new Error('Failed to initialize subscription');
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      // Admin users get unlimited subscription
      if (await this.isAdminUser(userId)) {
        return this.getAdminSubscription(userId);
      }

      const subscription = await firebaseService.getUserSubscription(userId);
      
      if (!subscription) {
        // Initialize subscription for new users
        return await this.initializeUserSubscription(userId);
      }

      // Check if subscription has expired
      if (subscription.endDate < new Date() && subscription.status === 'active') {
        await this.handleSubscriptionExpiry(subscription);
        return await firebaseService.getUserSubscription(userId);
      }

      return subscription;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      
      // If it's a permissions error and user is admin, return admin subscription
      if (error instanceof Error && error.message.includes('permissions') && await this.isAdminUser(userId)) {
        return this.getAdminSubscription(userId);
      }
      
      return null;
    }
  }

  /**
   * Get admin subscription (unlimited access)
   */
  private getAdminSubscription(userId: string): UserSubscription {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now

    return {
      id: `admin_sub_${userId}`,
      userId,
      plan: 'pro',
      status: 'active',
      startDate: now,
      endDate: futureDate,
      trialUsed: false,
      aiRequestsUsed: 0,
      aiRequestsLimit: 999999,
      features: {
        aiCoach: true,
        advancedAnalytics: true,
        smartInsights: true,
        prioritySupport: true,
        teamCollaboration: true,
        adminDashboard: true
      }
    };
  }

  /**
   * Handle subscription expiry
   */
  private async handleSubscriptionExpiry(subscription: UserSubscription): Promise<void> {
    try {
      const updatedSubscription: UserSubscription = {
        ...subscription,
        plan: 'basic',
        status: 'expired',
        trialUsed: true,
        aiRequestsLimit: this.BASIC_AI_REQUESTS_PER_DAY,
        features: {
          aiCoach: false,
          advancedAnalytics: false,
          smartInsights: false,
          prioritySupport: false,
          teamCollaboration: false,
          adminDashboard: false
        }
      };

      await firebaseService.saveUserSubscription(subscription.userId, updatedSubscription);
    } catch (error) {
      console.error('Error handling subscription expiry:', error);
    }
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
   * Check if user can access AI features
   */
  async canAccessAIFeatures(userId: string): Promise<boolean> {
    try {
      // Admin users have unlimited access
      if (await this.isAdminUser(userId)) {
        return true;
      }

      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) return false;

      // Check if subscription is active
      if (subscription.status !== 'active') return false;

      // Check daily AI request limit
      const today = new Date().toDateString();
      const lastRequestDate = await firebaseService.getLastAIRequestDate(userId);
      
      if (lastRequestDate !== today) {
        // Reset daily counter
        await firebaseService.resetDailyAIRequests(userId);
        subscription.aiRequestsUsed = 0;
      }

      return subscription.aiRequestsUsed < subscription.aiRequestsLimit;
    } catch (error) {
      console.error('Error checking AI feature access:', error);
      return false;
    }
  }

  /**
   * Record AI request usage
   */
  async recordAIRequest(userId: string): Promise<boolean> {
    try {
      // Admin users don't have usage limits
      if (await this.isAdminUser(userId)) {
        await firebaseService.recordAIRequest(userId);
        return true;
      }

      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) return false;

      if (subscription.aiRequestsUsed >= subscription.aiRequestsLimit) {
        return false;
      }

      // Increment usage counter
      subscription.aiRequestsUsed += 1;
      await firebaseService.saveUserSubscription(userId, subscription);
      await firebaseService.recordAIRequest(userId);

      return true;
    } catch (error) {
      console.error('Error recording AI request:', error);
      return false;
    }
  }

  /**
   * Get subscription limits for a user
   */
  async getSubscriptionLimits(userId: string): Promise<SubscriptionLimits> {
    try {
      // Admin users have unlimited access
      if (await this.isAdminUser(userId)) {
        return {
          aiRequestsPerDay: 999999,
          aiRequestsPerMonth: 999999,
          journalInsights: true,
          advancedFeatures: true,
          prioritySupport: true
        };
      }

      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return this.getBasicLimits();
      }

      switch (subscription.plan) {
        case 'trial':
        case 'pro':
          return {
            aiRequestsPerDay: this.PRO_AI_REQUESTS_PER_DAY,
            aiRequestsPerMonth: this.PRO_AI_REQUESTS_PER_DAY * 30,
            journalInsights: true,
            advancedFeatures: true,
            prioritySupport: true
          };
        case 'team':
          return {
            aiRequestsPerDay: this.PRO_AI_REQUESTS_PER_DAY * 2,
            aiRequestsPerMonth: this.PRO_AI_REQUESTS_PER_DAY * 60,
            journalInsights: true,
            advancedFeatures: true,
            prioritySupport: true
          };
        default:
          return this.getBasicLimits();
      }
    } catch (error) {
      console.error('Error getting subscription limits:', error);
      return this.getBasicLimits();
    }
  }

  /**
   * Get basic subscription limits
   */
  private getBasicLimits(): SubscriptionLimits {
    return {
      aiRequestsPerDay: this.BASIC_AI_REQUESTS_PER_DAY,
      aiRequestsPerMonth: this.BASIC_AI_REQUESTS_PER_DAY * 30,
      journalInsights: false,
      advancedFeatures: false,
      prioritySupport: false
    };
  }

  /**
   * Check if user's trial has expired
   */
  async isTrialExpired(userId: string): Promise<boolean> {
    try {
      // Admin users never have expired trials
      if (await this.isAdminUser(userId)) {
        return false;
      }

      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) return false;

      return subscription.plan === 'basic' && subscription.trialUsed;
    } catch (error) {
      console.error('Error checking trial expiry:', error);
      return false;
    }
  }

  /**
   * Get days remaining in trial
   */
  async getTrialDaysRemaining(userId: string): Promise<number> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || subscription.plan !== 'trial') return 0;

      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays);
    } catch (error) {
      console.error('Error getting trial days remaining:', error);
      return 0;
    }
  }

  /**
   * Upgrade user subscription
   */
  async upgradeSubscription(userId: string, plan: 'pro' | 'team'): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) return false;

      const now = new Date();
      const endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      const updatedSubscription: UserSubscription = {
        ...subscription,
        plan,
        status: 'active',
        endDate,
        aiRequestsLimit: plan === 'team' ? this.PRO_AI_REQUESTS_PER_DAY * 2 : this.PRO_AI_REQUESTS_PER_DAY,
        features: {
          aiCoach: true,
          advancedAnalytics: true,
          smartInsights: true,
          prioritySupport: true,
          teamCollaboration: plan === 'team',
          adminDashboard: plan === 'team'
        }
      };

      await firebaseService.saveUserSubscription(userId, updatedSubscription);
      return true;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }
  }

  /**
   * Show upgrade prompt for expired trial users
   */
  shouldShowUpgradePrompt(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    return subscription.plan === 'basic' && subscription.trialUsed;
  }

  /**
   * Get AI requests remaining today
   */
  async getAIRequestsRemaining(userId: string): Promise<number> {
    try {
      // Admin users have unlimited requests
      if (await this.isAdminUser(userId)) {
        return 999999;
      }

      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) return 0;

      return Math.max(0, subscription.aiRequestsLimit - subscription.aiRequestsUsed);
    } catch (error) {
      console.error('Error getting AI requests remaining:', error);
      return 0;
    }
  }
}

// Create singleton instance
const subscriptionService = new SubscriptionService();

export default subscriptionService;
export { SubscriptionService };