import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import useResponsive from '../hooks/useResponsive';
import FocusMateAvatar from './FocusMateAvatar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
              <div className="flex items-center space-x-2">
                <FocusMateAvatar size="sm" />
                <span className="font-bold text-gray-800 dark:text-white">FocusMate AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black bg-opacity-50"
                onClick={closeMobileMenu}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="fixed left-0 top-0 z-50 h-full"
              >
                <div className="relative">
                  <Sidebar />
                  <button
                    onClick={closeMobileMenu}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    aria-label="Close mobile menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Main Content */}
        <div className="flex-1 flex flex-col pt-16 pb-20 min-h-0">
          <main className="flex-1 overflow-y-auto p-2">
            <div className="max-w-full">
              {children}
            </div>
          </main>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-2">
          <div className="flex justify-around">
            <button className="flex flex-col items-center p-2 text-indigo-600 dark:text-indigo-400">
              <span className="text-xs mt-1">Dashboard</span>
            </button>
            <button className="flex flex-col items-center p-2 text-gray-500 dark:text-gray-400">
              <span className="text-xs mt-1">Timer</span>
            </button>
            <button className="flex flex-col items-center p-2 text-gray-500 dark:text-gray-400">
              <span className="text-xs mt-1">Journal</span>
            </button>
            <button className="flex flex-col items-center p-2 text-gray-500 dark:text-gray-400">
              <span className="text-xs mt-1">Stats</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Tablet Sidebar - Collapsed */}
        <div className="w-16 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-4">
          <FocusMateAvatar size="sm" animated />
          {/* Collapsed nav items would go here */}
        </div>

        {/* Tablet Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <main className="flex-1 overflow-y-auto p-4">
            <div className="max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
