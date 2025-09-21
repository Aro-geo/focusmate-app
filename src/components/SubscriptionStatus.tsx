import React, { useState, useEffect } from 'react';
import { Crown, Clock, Zap, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import subscriptionService, { UserSubscription } from '../services/SubscriptionService';

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
  compact?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ onUpgrade, compact = false }) => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [aiRequestsRemaining, setAiRequestsRemaining] = useState<number>(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    }
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [subData, trialDays, aiRequests] = await Promise.all([
        subscriptionService.getUserSubscription(user.id),
        subscriptionService.getTrialDaysRemaining(user.id),
        subscriptionService.getAIRequestsRemaining(user.id)
      ]);

      setSubscription(subData);
      setTrialDaysRemaining(trialDays);
      setAiRequestsRemaining(aiRequests);
      
      // Show upgrade prompt for expired trial users
      if (subData && subscriptionService.shouldShowUpgradePrompt(subData)) {
        setShowUpgradePrompt(true);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to pricing page or show upgrade modal
      window.open('mailto:focusmate-ai@hotmail.com?subject=Upgrade%20to%20Pro%20Plan', '_blank');
    }
  };

  if (loading) {
    return (
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="w-24 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription) return null;

  // Compact version for sidebar
  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${
        subscription.plan === 'trial' 
          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
          : subscription.plan === 'basic'
          ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
          : 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {subscription.plan === 'trial' ? (
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            ) : subscription.plan === 'basic' ? (
              <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Crown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className={`text-sm font-medium ${
              subscription.plan === 'trial' 
                ? 'text-yellow-700 dark:text-yellow-300'
                : subscription.plan === 'basic'
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-indigo-700 dark:text-indigo-300'
            }`}>
              {subscription.plan === 'trial' ? `Trial: ${trialDaysRemaining}d` : 
               subscription.plan === 'basic' ? 'Basic' : 'Pro'}
            </span>
          </div>
          {subscription.plan !== 'pro' && subscription.plan !== 'team' && (
            <button
              onClick={handleUpgrade}
              className="text-xs px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
        {subscription.plan === 'basic' && trialDaysRemaining === 0 && (
          <div className={`text-xs mt-1 ${
            aiRequestsRemaining <= 2 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {aiRequestsRemaining} AI requests left today
          </div>
        )}
      </div>
    );
  }

  // Full upgrade prompt modal
  if (showUpgradePrompt && subscription.plan === 'basic') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`max-w-md w-full rounded-2xl p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Trial Expired
              </h3>
            </div>
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className={`p-1 rounded-full ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              aria-label="Close upgrade prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your 3-month trial has ended. Upgrade to Pro to continue enjoying:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  AI Focus Coach & Smart Insights
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Advanced Analytics & Reports
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Unlimited AI Requests
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Priority Support
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className={`w-full py-2 px-4 rounded-lg border transition-colors ${
                darkMode 
                  ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              Continue with Basic (Limited Features)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trial status banner
  if (subscription.plan === 'trial' && trialDaysRemaining > 0) {
    return (
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5" />
            <div>
              <h4 className="font-semibold">Free Trial Active</h4>
              <p className="text-sm opacity-90">
                {trialDaysRemaining} days remaining • {aiRequestsRemaining} AI requests left today
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionStatus;