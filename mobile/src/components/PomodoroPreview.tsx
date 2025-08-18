import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as Haptics from 'expo-haptics';

interface PomodoroPreviewProps {
  navigation: any;
}

export default function PomodoroPreview({ navigation }: PomodoroPreviewProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const goToFullTimer = () => {
    navigation.navigate('Focus');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="clock" size={20} color="#6366f1" />
          <Text style={styles.title}>🍅 Focus Timer</Text>
        </View>
        <Text style={styles.status}>
          {isActive ? 'Active' : 'Ready'}
        </Text>
      </View>

      <View style={styles.timerDisplay}>
        <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={toggleTimer}
          style={[
            styles.controlButton,
            { backgroundColor: isActive ? '#ef4444' : '#6366f1' }
          ]}
        >
          <Icon 
            name={isActive ? 'pause' : 'play'} 
            size={16} 
            color="#ffffff" 
          />
          <Text style={styles.controlText}>
            {isActive ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToFullTimer}
          style={styles.fullTimerButton}
        >
          <Text style={styles.fullTimerText}>Full Timer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickSettings}>
        {[25, 15, 5].map((minutes) => (
          <TouchableOpacity
            key={minutes}
            onPress={() => {
              setTimeLeft(minutes * 60);
              setIsActive(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.quickButton,
              timeLeft === minutes * 60 && styles.activeQuickButton
            ]}
          >
            <Text style={[
              styles.quickButtonText,
              timeLeft === minutes * 60 && styles.activeQuickButtonText
            ]}>
              {minutes}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  status: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  controlText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  fullTimerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
  },
  fullTimerText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  quickSettings: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  activeQuickButton: {
    backgroundColor: '#6366f1',
  },
  quickButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeQuickButtonText: {
    color: '#ffffff',
  },
});