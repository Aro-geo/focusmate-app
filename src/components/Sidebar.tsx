import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Timer, 
  BookOpen, 
  BarChart3, 
  CheckSquare
} from 'lucide-react';
import StaggeredList from './StaggeredList';
import UserProfileDropdown from './UserProfileDropdown';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FocusMateAvatar from './FocusMateAvatar';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const navItems = [
    { to: '/app/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/app/pomodoro', icon: Timer, label: 'Pomodoro' },
    { to: '/app/journal', icon: BookOpen, label: 'Journal' },
    { to: '/app/stats', icon: BarChart3, label: 'Stats' },
    { to: '/app/todos', icon: CheckSquare, label: 'Todos' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation handled by AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <motion.div 
      className="w-full md:w-64 bg-white dark:bg-gray-900 shadow-lg h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 flex-shrink-0 fixed md:relative z-50 md:z-auto"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      {/* Logo */}
      <motion.div 
        className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <FocusMateAvatar 
            size="lg"
            animated
          />
          <span className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">FocusMate AI</span>
        </div>
      </motion.div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 md:p-4">
        <StaggeredList staggerDelay={0.1}>
          {navItems.map((item, index) => (
            <motion.div key={item.to} className="mb-2">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 md:px-4 rounded-lg transition-all duration-200 text-sm md:text-base ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-r-2 border-indigo-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div 
                    className="flex items-center space-x-3 w-full"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon size={20} />
                    </motion.div>
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                )}
              </NavLink>
            </motion.div>
          ))}
        </StaggeredList>
      </nav>

      {/* User Profile at Bottom */}
      <motion.div
        className="border-t border-gray-100 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <UserProfileDropdown
          name={user?.name || 'User'}
          email={user?.email || ''}
          onLogout={handleLogout}
          onThemeToggle={toggleTheme}
          isDarkMode={theme === 'dark'}
        />
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;
