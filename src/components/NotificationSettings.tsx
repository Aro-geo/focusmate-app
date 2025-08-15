import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import taskNotificationService from '../services/TaskNotificationService';

interface NotificationSettingsProps {
    onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
    const { darkMode } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [dueDateReminders, setDueDateReminders] = useState(true);
    const [scheduledReminders, setScheduledReminders] = useState(true);
    const [reminderTime, setReminderTime] = useState(60); // minutes before due date
    const [testingNotification, setTestingNotification] = useState(false);

    useEffect(() => {
        // Check current notification permission
        if ('Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    const handleEnableNotifications = async () => {
        if (!('Notification' in window)) {
            alert('Your browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            setNotificationsEnabled(true);
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');

        if (permission === 'denied') {
            alert('Notifications were denied. Please enable them in your browser settings to receive task reminders.');
        }
    };

    const handleTestNotification = async () => {
        setTestingNotification(true);
        try {
            await taskNotificationService.testNotification();
        } catch (error) {
            console.error('Error testing notification:', error);
        } finally {
            setTestingNotification(false);
        }
    };

    const getNotificationStatus = () => {
        if (!('Notification' in window)) {
            return { status: 'unsupported', message: 'Not supported by browser', color: 'text-red-500' };
        }

        switch (Notification.permission) {
            case 'granted':
                return { status: 'enabled', message: 'Enabled', color: 'text-green-500' };
            case 'denied':
                return { status: 'denied', message: 'Denied', color: 'text-red-500' };
            default:
                return { status: 'default', message: 'Not enabled', color: 'text-yellow-500' };
        }
    };

    const notificationStatus = getNotificationStatus();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`max-w-md w-full mx-4 rounded-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notification Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        ×
                    </button>
                </div>

                {/* Notification Status */}
                <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Browser Notifications
                        </span>
                        <div className="flex items-center space-x-2">
                            {notificationStatus.status === 'enabled' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                            )}
                            <span className={`text-sm ${notificationStatus.color}`}>
                                {notificationStatus.message}
                            </span>
                        </div>
                    </div>

                    {!notificationsEnabled && (
                        <button
                            onClick={handleEnableNotifications}
                            className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                            Enable Notifications
                        </button>
                    )}
                </div>

                {/* Notification Types */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Clock className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                            <div>
                                <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Due Date Reminders
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Get notified before tasks are due
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={dueDateReminders}
                                onChange={(e) => setDueDateReminders(e.target.checked)}
                                className="sr-only peer"
                                disabled={!notificationsEnabled}
                                aria-label="Enable due date reminders"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${notificationsEnabled ? 'peer-checked:bg-blue-600' : 'opacity-50 cursor-not-allowed'
                                }`}></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Bell className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                            <div>
                                <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Scheduled Task Reminders
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Get notified when it's time to work on scheduled tasks
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={scheduledReminders}
                                onChange={(e) => setScheduledReminders(e.target.checked)}
                                className="sr-only peer"
                                disabled={!notificationsEnabled}
                                aria-label="Enable scheduled task reminders"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${notificationsEnabled ? 'peer-checked:bg-blue-600' : 'opacity-50 cursor-not-allowed'
                                }`}></div>
                        </label>
                    </div>
                </div>

                {/* Reminder Timing */}
                {dueDateReminders && notificationsEnabled && (
                    <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                            }`}>
                            Remind me before due date
                        </label>
                        <select
                            value={reminderTime}
                            onChange={(e) => setReminderTime(Number(e.target.value))}
                            aria-label="Select reminder time before due date"
                            className={`w-full p-2 rounded-lg border ${darkMode
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={1440}>1 day</option>
                        </select>
                    </div>
                )}

                {/* Test Notification */}
                {notificationsEnabled && (
                    <div className="mb-6">
                        <button
                            onClick={handleTestNotification}
                            disabled={testingNotification}
                            className={`w-full py-2 px-4 rounded-lg border transition-colors ${darkMode
                                ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                                } ${testingNotification ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {testingNotification ? 'Sending Test...' : 'Send Test Notification'}
                        </button>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={onClose}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                    Save Settings
                </button>

                {/* Info */}
                <p className={`text-xs mt-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    Notifications will only work when FocusMate AI is open in your browser
                </p>
            </div>
        </div>
    );
};

export default NotificationSettings;