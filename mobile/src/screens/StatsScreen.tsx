import React, { useState } from 'react';
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
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const achievements = [
    { id: 1, icon: '🔥', title: '7-day streak', unlocked: true },
    { id: 2, icon: '🎯', title: '50 tasks', unlocked: true },
    { id: 3, icon: '🍅', title: '100 sessions', unlocked: false },
    { id: 4, icon: '⭐', title: 'Early bird', unlocked: true },
  ];

  const weeklyData = [
    { day: 'M', value: 80, sessions: 4 },
    { day: 'T', value: 95, sessions: 5 },
    { day: 'W', value: 60, sessions: 3 },
    { day: 'T', value: 85, sessions: 4 },
    { day: 'F', value: 100, sessions: 6 },
    { day: 'S', value: 40, sessions: 2 },
    { day: 'S', value: 70, sessions: 3 },
  ];

  const goals = [
    { title: 'Daily tasks', current: 3, target: 5, percentage: 60 },
    { title: 'Focus time', current: 2, target: 4, unit: 'h', percentage: 50 },
    { title: 'Journal entries', current: 5, target: 7, unit: 'days', percentage: 71 },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>📊 Analytics & Stats</Text>
          <View style={styles.periodSelector}>
            {['week', 'month'].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.activePeriodButton
                ]}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period && styles.activePeriodText
                ]}>
                  {period === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
          <Text style={styles.cardTitle}>🏆 Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementItem,
                  !achievement.unlocked && styles.lockedAchievement
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.lockedText
                ]}>
                  {achievement.title}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Weekly Overview */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.card}>
          <Text style={styles.cardTitle}>📈 Weekly Overview</Text>
          
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>18/25</Text>
              <Text style={styles.statLabel}>Tasks</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '72%' }]} />
              </View>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12h/20h</Text>
              <Text style={styles.statLabel}>Focus</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '60%', backgroundColor: '#8b5cf6' }]} />
              </View>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.sessionsIcon}>🍅</Text>
            </View>
          </View>
        </Animated.View>

        {/* Productivity Chart */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.card}>
          <Text style={styles.cardTitle}>📊 Productivity Chart</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {weeklyData.map((data, index) => (
                <View key={index} style={styles.chartBar}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${data.value}%` }
                    ]}
                  />
                  <Text style={styles.chartLabel}>{data.day}</Text>
                  <Text style={styles.sessionCount}>{data.sessions}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Goals Progress */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Goals Progress</Text>
          <View style={styles.goalsList}>
            {goals.map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalValue}>
                    {goal.current}/{goal.target}{goal.unit ? ` ${goal.unit}` : ''}
                  </Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${goal.percentage}%`,
                        backgroundColor: getProgressColor(goal.percentage)
                      }
                    ]}
                  />
                </View>
                <Text style={styles.goalPercentage}>{goal.percentage}%</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Comparison View */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.card}>
          <Text style={styles.cardTitle}>📈 This Week vs. Last Week</Text>
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Tasks Completed</Text>
              <View style={styles.comparisonValues}>
                <Text style={styles.currentValue}>18</Text>
                <Icon name="arrow-up" size={16} color="#10b981" />
                <Text style={styles.changeValue}>+3</Text>
              </View>
              <Text style={styles.comparisonSubtext}>vs. 15 last week</Text>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Focus Time</Text>
              <View style={styles.comparisonValues}>
                <Text style={styles.currentValue}>12h</Text>
                <Icon name="arrow-down" size={16} color="#ef4444" />
                <Text style={styles.changeValue}>-2h</Text>
              </View>
              <Text style={styles.comparisonSubtext}>vs. 14h last week</Text>
            </View>
          </View>
        </Animated.View>

        {/* Heatmap Calendar */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Focus Streak Calendar</Text>
          <View style={styles.heatmapContainer}>
            <Text style={styles.heatmapLabel}>Last 30 days</Text>
            <View style={styles.heatmap}>
              {Array.from({ length: 30 }).map((_, index) => {
                const intensity = Math.random();
                return (
                  <View
                    key={index}
                    style={[
                      styles.heatmapCell,
                      {
                        backgroundColor: intensity > 0.7 ? '#10b981' :
                                       intensity > 0.4 ? '#84cc16' :
                                       intensity > 0.2 ? '#eab308' : '#f3f4f6'
                      }
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={styles.legendText}>Less</Text>
              <View style={styles.legendColors}>
                {['#f3f4f6', '#eab308', '#84cc16', '#10b981'].map((color, i) => (
                  <View key={i} style={[styles.legendColor, { backgroundColor: color }]} />
                ))}
              </View>
              <Text style={styles.legendText}>More</Text>
            </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activePeriodText: {
    color: '#1f2937',
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
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  lockedText: {
    color: '#9ca3af',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
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
    marginBottom: 8,
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
  sessionsIcon: {
    fontSize: 16,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    backgroundColor: '#6366f1',
    borderRadius: 2,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  sessionCount: {
    fontSize: 10,
    color: '#9ca3af',
  },
  goalsList: {
    gap: 16,
  },
  goalItem: {
    marginBottom: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalPercentage: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  comparisonContainer: {
    gap: 16,
  },
  comparisonItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  comparisonSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  heatmapContainer: {
    alignItems: 'center',
  },
  heatmapLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 80,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heatmapCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginBottom: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  legendColors: {
    flexDirection: 'row',
    gap: 2,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});