import React from 'react';
import { motion } from 'framer-motion';
import { Crown, X, Zap, BarChart3, Brain, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'ai_limit' | 'feature_limit' | 'trial_expired';
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  isOpen, 
  onClose, 
  reason = 'ai_limit' 
}) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    window.open('mailto:focusmate-ai@hotmail.com?subject=Upgrade%20to%20Pro%20Plan', '_blank');
    onClose();
  };

  const getPromptContent = () => {
    switch (reason) {
      case 'ai_limit':
        return {
          title: 'AI Request Limit Reached',
          message: 'You\'ve used all your daily AI requests. Upgrade to Pro for unlimited access!',
          icon: Brain
        };
      case 'feature_limit':
        return {
          title: 'Premium Feature',
          message: 'This feature is available in Pro plan. Upgrade to unlock advanced analytics!',
          icon: BarChart3
        };
      case 'trial_expired':
        return {
          title: 'Trial Expired',
          message: 'Your 3-month trial has ended. Continue with Pro to keep all features!',
          icon: Clock
        };
      default:
        return {
          title: 'Upgrade to Pro',
          message: 'Unlock all premium features with Pro plan!',
          icon: Crown
        };
    }
  };

  const content = getPromptContent();
  const IconComponent = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`max-w-md w-full rounded-2xl p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <IconComponent className="w-6 h-6 text-indigo-500" />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {content.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {content.message}
        </p>

        <div className="mb-6">
          <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Pro Features:
          </h4>
          <ul className="space-y-2">
            {[
              { icon: Brain, text: 'Unlimited AI requests' },
              { icon: BarChart3, text: 'Advanced analytics' },
              { icon: Zap, text: 'Smart insights & tips' },
              { icon: Crown, text: 'Priority support' }
            ].map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <feature.icon className="w-4 h-4 text-indigo-500" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to Pro</span>
          </button>
          <button
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-lg border transition-colors ${
              darkMode 
                ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UpgradePrompt;