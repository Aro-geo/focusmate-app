import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function FocusScreen() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [session, setSession] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [minimalMode, setMinimalMode] = useState(false);
  const [distractions, setDistractions] = useState(0);

  const pulseAnimation = useSharedValue(1);
  const progressAnimation = useSharedValue(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (isActive) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseAnimation.value = withTiming(1);
    }
  }, [isActive]);

  const handleSessionComplete = () => {
    setIsActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (!isBreak) {
      setSession(prev => prev + 1);
      setIsBreak(true);
      setTimeLeft(5 * 60); // 5 minute break
    } else {
      setIsBreak(false);
      setTimeLeft(25 * 60); // Back to work
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setSession(1);
    setIsBreak(false);
    setDistractions(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addDistraction = () => {
    setDistractions(prev => prev + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  if (minimalMode) {
    return (
      <View style={styles.minimalContainer}>
        <LinearGradient
          colors={isBreak ? ['#10b981', '#059669'] : ['#6366f1', '#8b5cf6']}
          style={styles.minimalGradient}
        >
          <TouchableOpacity
            onPress={() => setMinimalMode(false)}
            style={styles.exitMinimal}
          >
            <Icon name="minimize-2" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Animated.View style={[styles.minimalTimer, animatedStyle]}>
            <Text style={styles.minimalTime}>{formatTime(timeLeft)}</Text>
            <Text style={styles.minimalLabel}>
              {isBreak ? 'Break Time' : 'Focus Time'}
            </Text>
          </Animated.View>
          
          <TouchableOpacity onPress={toggleTimer} style={styles.minimalButton}>
            <Icon 
              name={isActive ? 'pause' : 'play'} 
              size={32} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMinimalMode(true)}>
          <Icon name="maximize-2" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Session</Text>
        <TouchableOpacity onPress={resetTimer}>
          <Icon name="refresh-cw" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.currentTask}>
          Current Task: Review project proposal
        </Text>

        <View style={styles.timerContainer}>
          <Animated.View style={[styles.timerCircle, animatedStyle]}>
            <LinearGradient
              colors={isBreak ? ['#10b981', '#059669'] : ['#6366f1', '#8b5cf6']}
              style={styles.timerGradient}
            >
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <View style={styles.progressIndicator}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      { opacity: i < (progress / 10) ? 1 : 0.3 }
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            Session: {session}/4 🍅
          </Text>
          <Text style={styles.breakText}>
            {isBreak ? 'Break: 5 min' : 'Next break: 5 min'}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={toggleTimer}
            style={[
              styles.mainButton,
              { backgroundColor: isActive ? '#ef4444' : '#6366f1' }
            ]}
          >
            <Icon 
              name={isActive ? 'pause' : 'play'} 
              size={24} 
              color="#ffffff" 
            />
            <Text style={styles.buttonText}>
              {isActive ? 'PAUSE' : 'START'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.distractionsContainer}>
          <Text style={styles.distractionsTitle}>🎯 Distractions: {distractions}</Text>
          <View style={styles.distractionsButtons}>
            <TouchableOpacity onPress={addDistraction} style={styles.distractionButton}>
              <Icon name="smartphone" size={16} color="#6b7280" />
              <Text style={styles.distractionText}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addDistraction} style={styles.distractionButton}>
              <Icon name="message-circle" size={16} color="#6b7280" />
              <Text style={styles.distractionText}>Thought</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addDistraction} style={styles.distractionButton}>
              <Icon name="plus" size={16} color="#6b7280" />
              <Text style={styles.distractionText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentTask: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  timerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  progressIndicator: {
    flexDirection: 'row',
    marginTop: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 2,
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  breakText: {
    fontSize: 14,
    color: '#6b7280',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 140,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  distractionsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  distractionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  distractionsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  distractionButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    minWidth: 80,
  },
  distractionText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  // Minimal Mode Styles
  minimalContainer: {
    flex: 1,
  },
  minimalGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitMinimal: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 12,
  },
  minimalTimer: {
    alignItems: 'center',
  },
  minimalTime: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  minimalLabel: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 8,
  },
  minimalButton: {
    position: 'absolute',
    bottom: 100,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
  },
});