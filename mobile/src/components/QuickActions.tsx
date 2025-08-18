import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import * as Haptics from 'expo-haptics';

interface QuickActionsProps {
  navigation: any;
}

export default function QuickActions({ navigation }: QuickActionsProps) {
  const handlePress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (action) {
      case 'focus':
        navigation.navigate('Focus');
        break;
      case 'journal':
        navigation.navigate('Journal');
        break;
      case 'stats':
        navigation.navigate('Stats');
        break;
      case 'ai':
        // Navigate to AI chat
        break;
    }
  };

  const actions = [
    { id: 'focus', icon: 'play', label: 'Start Focus', colors: ['#6366f1', '#8b5cf6'] },
    { id: 'journal', icon: 'book-open', label: 'Journal', colors: ['#8b5cf6', '#d946ef'] },
    { id: 'stats', icon: 'trending-up', label: 'Stats', colors: ['#f59e0b', '#f97316'] },
    { id: 'ai', icon: 'zap', label: 'AI Coach', colors: ['#10b981', '#059669'] },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚡ Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handlePress(action.id)}
            style={styles.actionButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={action.colors}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name={action.icon} size={24} color="#ffffff" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});