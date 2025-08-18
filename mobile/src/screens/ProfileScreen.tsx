import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    focusReminders: true,
    aiSuggestions: true,
  });

  const userStats = [
    { label: 'Current streak', value: '7 days', icon: '🔥' },
    { label: 'Total tasks', value: '156', icon: '🎯' },
    { label: 'Focus sessions', value: '89', icon: '🍅' },
    { label: 'Total focus time', value: '67h', icon: '⏱️' },
  ];

  const menuItems = [
    { 
      title: 'Export Data', 
      icon: 'download', 
      action: () => Alert.alert('Export', 'Data export feature coming soon!'),
      color: '#6366f1'
    },
    { 
      title: 'Subscription', 
      icon: 'credit-card', 
      subtitle: 'Pro Plan',
      action: () => Alert.alert('Subscription', 'Manage your subscription'),
      color: '#8b5cf6'
    },
    { 
      title: 'Help & Support', 
      icon: 'help-circle', 
      action: () => Alert.alert('Help', 'Contact support'),
      color: '#10b981'
    },
    { 
      title: 'Privacy Policy', 
      icon: 'shield', 
      action: () => Alert.alert('Privacy', 'View privacy policy'),
      color: '#f59e0b'
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>👤 Profile</Text>
          <TouchableOpacity>
            <Icon name="edit-2" size={20} color="#6b7280" />
          </TouchableOpacity>
        </Animated.View>

        {/* User Info */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <Text style={styles.memberSince}>Member since Jan 2024</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.card}>
          <Text style={styles.cardTitle}>📊 Your Stats</Text>
          <View style={styles.statsGrid}>
            {userStats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ Settings</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="bell" size={20} color="#6b7280" />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={() => toggleSetting('notifications')}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor={settings.notifications ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="moon" size={20} color="#6b7280" />
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor={isDark ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="volume-2" size={20} color="#6b7280" />
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <Switch
                value={settings.soundEffects}
                onValueChange={() => toggleSetting('soundEffects')}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor={settings.soundEffects ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="clock" size={20} color="#6b7280" />
                <Text style={styles.settingLabel}>Focus Reminders</Text>
              </View>
              <Switch
                value={settings.focusReminders}
                onValueChange={() => toggleSetting('focusReminders')}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor={settings.focusReminders ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="zap" size={20} color="#6b7280" />
                <Text style={styles.settingLabel}>AI Suggestions</Text>
              </View>
              <Switch
                value={settings.aiSuggestions}
                onValueChange={() => toggleSetting('aiSuggestions')}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor={settings.aiSuggestions ? '#ffffff' : '#f3f4f6'}
              />
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.action}
                style={styles.menuItem}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <Icon name={item.icon} size={20} color={item.color} />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Achievements Preview */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.card}>
          <Text style={styles.cardTitle}>🏆 Recent Achievements</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>🔥</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>7-Day Streak</Text>
                <Text style={styles.achievementDate}>Unlocked today</Text>
              </View>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>🎯</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Task Master</Text>
                <Text style={styles.achievementDate}>50 tasks completed</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.signOutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.signOutButton}>
            <Icon name="log-out" size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  menuList: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  achievementDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  signOutContainer: {
    padding: 20,
    paddingTop: 0,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
    marginLeft: 8,
  },
});