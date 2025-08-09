import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Timer, 
  BookOpen, 
  BarChart3, 
  CheckSquare,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FocusMateAvatar } from './FocusMateAvatar';

const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  
  const navItems = [
    { to: '/app/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/app/pomodoro', icon: Timer, label: 'Pomodoro' },
    { to: '/app/journal', icon: BookOpen, label: 'Journal' },
    { to: '/app/stats', icon: BarChart3, label: 'Stats' },
    { to: '/app/todos', icon: CheckSquare, label: 'Todos' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          )}
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <FocusMateAvatar size="sm" animated />
                  <span className="text-lg font-bold text-gray-800 dark:text-white">FocusMate AI</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`
                      }
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileNav;