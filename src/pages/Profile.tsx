import React, { useState, useEffect } from 'react';
import { Bell, Edit, Save, Award, Sparkles, LogOut, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { firebaseService } from '../services/FirebaseService';
import { exportService } from '../services/ExportService';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    name: '',
    email: '',
    bio: '',
    avatarUrl: ''
  });
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    focusTime: 0,
    journalEntries: 0,
  });
  const [aiFeedback, setAiFeedback] = useState('');
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailDigest: true,
    taskReminders: true,
    pomodoroAlerts: true,
    weeklyReports: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Load real user data from Firebase
  useEffect(() => {
    if (user) {
      setEditableData({
        name: user.name || 'User',
        email: user.email || '',
        bio: '',
        avatarUrl: user.avatar || ''
      });
      setIsLoading(false);
    }
  }, [user]);

  // Fetch real user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      try {
        const userTasks = await firebaseService.getTasks();
        const completedTasks = userTasks.filter(task => task.completed);
        
        setStats({
          totalTasks: userTasks.length,
          completedTasks: completedTasks.length,
          focusTime: 0, // TODO: Implement pomodoro stats
          journalEntries: 0, // TODO: Implement journal service
        });

        const completionRate = userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0;
        
        const userName = user.name || 'there';
        setAiFeedback(
          `Great progress, ${userName}! You've completed ${completionRate.toFixed(0)}% of your tasks. ` +
          `${completionRate > 80 ? "You're crushing your goals!" : "Keep pushing - you're on the right track!"}`
        );
      } catch (error) {
        console.error('Error fetching user statistics:', error);
        setAiFeedback('Welcome! Start adding tasks and focus sessions to see your progress here.');
      }
    };

    fetchUserStats();
  }, [user]);

  // Handle save profile edits
  const handleSaveProfile = async () => {
    // TODO: Implement profile update in Firebase
    setIsEditing(false);
    alert('Profile update functionality will be implemented soon.');
  };

  // Define type for notification preference keys
  type NotificationKey = 'emailDigest' | 'taskReminders' | 'pomodoroAlerts' | 'weeklyReports';
  
  // Handle notification preferences change
  const handleNotificationChange = (key: NotificationKey) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle profile export
  const handleExportProfile = async () => {
    if (!user) return;
    
    try {
      setIsExporting(true);
      
      const userProfile = {
        name: user.name || 'User',
        email: user.email || '',
        joinDate: new Date(user.createdAt || Date.now()),
        totalSessions: stats.completedTasks,
        totalFocusTime: stats.focusTime,
        streakCount: 0 // Would be calculated from actual data
      };
      
      await exportService.exportProfileToPDF(userProfile, {
        stats,
        notificationPreferences,
        aiFeedback
      });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Profile</h1>

      {/* Profile Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editableData.name}
                  onChange={(e) => setEditableData({ ...editableData, name: e.target.value })}
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 mb-1 text-xl font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  aria-label="Name"
                  placeholder="Your Name"
                />
              ) : (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
              )}
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              <div className="flex items-center mt-1">
                <Award size={16} className="text-indigo-600 dark:text-indigo-400 mr-1" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Productivity Champion</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <button 
                onClick={handleSaveProfile} 
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Save size={16} className="mr-1" /> Save
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Edit size={16} className="mr-1" /> Edit Profile
                </button>
                <button 
                  onClick={handleExportProfile}
                  disabled={isExporting}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Download size={16} className="mr-1" /> 
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2 text-gray-900 dark:text-white">About Me</h3>
          {isEditing ? (
            <div>
              <label htmlFor="bio-textarea" className="sr-only">About Me</label>
              <textarea
                id="bio-textarea"
                value={editableData.bio}
                onChange={(e) => setEditableData({ ...editableData, bio: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Tell us about yourself"
                aria-label="Biography"
              />
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">{editableData.bio || 'No bio added yet.'}</p>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Productivity Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTasks} <span className="text-sm text-gray-500 dark:text-gray-400">/ {stats.totalTasks}</span></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}% completion rate
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Focus Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.focusTime} <span className="text-sm text-gray-500 dark:text-gray-400">hours</span></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across {Math.round(stats.focusTime * 2)} sessions
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Journal Entries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.journalEntries}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(stats.journalEntries / 30 * 100)}% daily journaling
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Avg. Focus</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">28 <span className="text-sm text-gray-500 dark:text-gray-400">min</span></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Per session
              </p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/stats" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
              View detailed stats →
            </a>
          </div>
        </div>
        
        {/* AI Feedback */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="text-indigo-600 dark:text-indigo-400 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h2>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">{aiFeedback}</p>
          </div>
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">Recent Achievements</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">🔥 7-Day Streak</span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">🎯 Focus Master</span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">📝 Journal Pro</span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">✅ Task Champion</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications & Tasks Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Notification Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Bell className="text-indigo-600 dark:text-indigo-400 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(notificationPreferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center justify-between w-full">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={() => handleNotificationChange(key as NotificationKey)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Tasks</h2>
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked 
                    className="mr-3" 
                    disabled 
                    aria-label="Update portfolio website task"
                  />
                  <span className="line-through text-gray-500 dark:text-gray-400">Update portfolio website</span>
                </label>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">2 days ago</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked 
                    className="mr-3" 
                    disabled 
                    aria-label="Research project ideas task"
                  />
                  <span className="line-through text-gray-500 dark:text-gray-400">Research project ideas</span>
                </label>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Yesterday</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-3" 
                    disabled 
                    aria-label="Complete FocusMate project task"
                  />
                  <span className="text-gray-900 dark:text-white">Complete FocusMate project</span>
                </label>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Today</span>
            </li>
          </ul>
          <div className="mt-4">
            <a href="/dashboard" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
              View all tasks →
            </a>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <LogOut size={16} className="mr-2" /> 
            Logout
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
            Change Password
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
