import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import QuickActions from '../components/QuickActions';
import PomodoroPreview from '../components/PomodoroPreview';
import TasksPreview from '../components/TasksPreview';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [greeting, setGreeting] = useState('');
  const [completedTasks, setCompletedTasks] = useState(3);
  const [totalTasks, setTotalTasks] = useState(5);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting}, Alex! 👋</Text>
              <Text style={styles.subtitle}>Ready to make today productive?</Text>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{completedTasks}/{totalTasks}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <QuickActions navigation={navigation} />
        </Animated.View>

        {/* Pomodoro Preview */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <PomodoroPreview navigation={navigation} />
        </Animated.View>

        {/* Tasks Preview */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <TasksPreview 
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            onTaskUpdate={(completed: number, total: number) => {
              setCompletedTasks(completed);
              setTotalTasks(total);
            }}
          />
        </Animated.View>

        {/* Weekly Overview */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.progressItem}>
            <Text style={styles.progressText}>Tasks Completed</Text>
            <Text style={styles.progressNumber}>12/15</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '80%' }]} />
          </View>
          
          <View style={styles.progressItem}>
            <Text style={styles.progressText}>Focus Time</Text>
            <Text style={styles.progressNumber}>18h / 25h</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '72%', backgroundColor: '#8b5cf6' }]} />
          </View>
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
    padding: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
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
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
});