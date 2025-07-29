import React from 'react';
import { Sun, Moon, Target, Clock, CheckSquare, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MobileTestComponent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const features = [
    { icon: Target, title: 'Focus Sessions', description: 'Track your deep work sessions' },
    { icon: Clock, title: 'Pomodoro Timer', description: '25-minute focused work periods' },
    { icon: CheckSquare, title: 'Task Management', description: 'Organize your daily tasks' },
    { icon: BarChart3, title: 'Analytics', description: 'View your productivity stats' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Header with Theme Toggle */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FM</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">FocusMate AI</h1>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Productivity
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your work habits with intelligent focus sessions, task management, and insightful analytics.
          </p>
        </div>

        {/* Features Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg mb-4">
                <feature.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Theme Demo Section */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Dark/Light Theme Toggle
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Current Theme</h4>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${theme === 'light' ? 'bg-yellow-500' : 'bg-indigo-500'}`}></div>
                <span className="text-gray-700 dark:text-gray-300 capitalize">{theme} Mode</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Responsive Design</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-sm">
                  Mobile ✓
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                  Tablet ✓
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                  Desktop ✓
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-specific message */}
        <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg md:hidden">
          <p className="text-indigo-800 dark:text-indigo-300 text-sm text-center">
            📱 You're viewing the mobile-optimized layout!
          </p>
        </div>

        {/* Test Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button className="btn-primary">
            Primary Button
          </button>
          <button className="btn-secondary">
            Secondary Button
          </button>
          <button className="btn-outline">
            Outline Button
          </button>
        </div>
      </main>
    </div>
  );
};

export default MobileTestComponent;
