import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Brain, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavigationProps {
  onSignIn: () => void;
  onGetStarted: () => void;
  darkMode?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ onSignIn, onGetStarted, darkMode = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Contact', href: '#contact' }
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      darkMode 
        ? 'bg-gray-900/95 backdrop-blur-md border-gray-800' 
        : 'bg-white/95 backdrop-blur-md border-gray-200'
    } border-b transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="url(#gradient)" />
                <path d="M10 14c0-3.314 2.686-6 6-6s6 2.686 6 6c0 1.2-.35 2.317-.955 3.259L22 18.25c0 1.657-1.343 3-3 3h-6c-1.657 0-3-1.343-3-3l.955-.991C10.35 16.317 10 15.2 10 14z" fill="white" opacity="0.9"/>
                <circle cx="13" cy="13" r="1" fill="white" opacity="0.8"/>
                <circle cx="19" cy="13" r="1" fill="white" opacity="0.8"/>
                <circle cx="16" cy="16" r="1" fill="white" opacity="0.8"/>
                <line x1="13" y1="13" x2="16" y2="16" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                <line x1="19" y1="13" x2="16" y2="16" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#6366f1', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#a855f7', stopOpacity:1}} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                FocusMate AI
              </span>
              <span className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Smart Productivity
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className={`text-sm font-medium transition-colors duration-200 hover:text-indigo-500 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.name}
              </motion.button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.button
              onClick={onSignIn}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                darkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={onGetStarted}
              className={`flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 ${
                darkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-indigo-500 hover:bg-indigo-600'
              } shadow-lg hover:shadow-xl`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                darkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={`md:hidden ${
              darkMode ? 'bg-gray-900' : 'bg-white'
            } border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Items */}
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className={`block w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.name}
                </motion.button>
              ))}

              {/* Mobile Auth Buttons */}
              <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  onClick={onSignIn}
                  className={`block w-full px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
                <motion.button
                  onClick={onGetStarted}
                  className={`flex items-center justify-center space-x-2 w-full px-4 py-3 text-base font-medium text-white rounded-lg transition-all duration-200 ${
                    darkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'bg-indigo-500 hover:bg-indigo-600'
                  } shadow-lg`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Mobile App Download Hint */}
              <div className={`mt-6 p-4 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  💡 <strong>Mobile Tip:</strong> Add FocusMate AI to your home screen for the best mobile experience!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;