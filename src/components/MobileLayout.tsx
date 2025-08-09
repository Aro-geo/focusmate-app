import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Timer, BookOpen, BarChart3, Settings, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useResponsive from '../hooks/useResponsive';
import FocusMateAvatar from './FocusMateAvatar';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const location = useLocation();
  const navigate = useNavigate();

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('dashboard')) setActiveTab('dashboard');
    else if (path.includes('pomodoro')) setActiveTab('timer');
    else if (path.includes('journal')) setActiveTab('journal');
    else if (path.includes('stats')) setActiveTab('stats');
    else if (path.includes('profile')) setActiveTab('profile');
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Home', path: '/dashboard' },
    { id: 'timer', icon: Timer, label: 'Focus', path: '/pomodoro' },
    { id: 'journal', icon: BookOpen, label: 'Journal', path: '/journal' },
    { id: 'stats', icon: BarChart3, label: 'Stats', path: '/stats' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleTabPress = (item: typeof navigationItems[0]) => {
    setActiveTab(item.id);
    navigate(item.path);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Mobile Header - Fixed */}
        <motion.header 
          className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="px-4 py-3 safe-area-inset-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 active:scale-95 transition-transform"
                  whileTap={{ scale: 0.9 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.button>
                <div className="flex items-center space-x-2">
                  <FocusMateAvatar size="md" animated />
                  <span className="font-bold text-gray-800 dark:text-white text-lg">FocusMate</span>
                </div>
              </div>
              
              <motion.button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                whileTap={{ scale: 0.9 }}
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={closeMobileMenu}
              />
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw]"
              >
                <div className="relative h-full">
                  <Sidebar />
                  <motion.button
                    onClick={closeMobileMenu}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 shadow-lg"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Main Content - Scrollable */}
        <main className="flex-1 pt-20 pb-24 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="px-4 py-6 space-y-6 min-h-full">
              {children}
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation - Fixed */}
        <motion.nav 
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="px-2 py-2 pb-safe">
            <div className="flex justify-around items-center">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleTabPress(item)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-20 ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    animate={isActive ? { y: -2 } : { y: 0 }}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                    <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''} truncate`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                        layoutId="activeIndicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.nav>
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Tablet Sidebar - Compact */}
        <motion.aside 
          className="w-20 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-6"
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-8">
            <span className="text-white font-bold">F</span>
          </div>
          
          <nav className="flex flex-col space-y-4 flex-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabPress(item)}
                  className={`p-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  title={item.label}
                >
                  <Icon className="h-6 w-6" />
                  
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                </motion.button>
              );
            })}
          </nav>
        </motion.aside>

        {/* Tablet Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6 max-w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Desktop Layout - Use existing responsive layout
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-8 max-w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MobileLayout;
