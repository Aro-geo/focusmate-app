import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
  tags: string[];
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      date: '2024-01-15',
      content: 'Had a productive morning working on the project proposal. Feeling focused and motivated.',
      mood: '😊',
      tags: ['work', 'productive', 'focus']
    }
  ]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [newTags, setNewTags] = useState('');

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😔', label: 'Sad' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🤔', label: 'Thoughtful' },
    { emoji: '😤', label: 'Frustrated' },
    { emoji: '🥳', label: 'Excited' },
    { emoji: '😌', label: 'Calm' },
  ];

  const aiInsights = [
    {
      type: 'pattern',
      icon: '📈',
      title: 'Productivity Pattern',
      content: 'You\'re most productive in the morning hours between 9-11 AM.'
    },
    {
      type: 'mood',
      icon: '😊',
      title: 'Mood Correlation',
      content: 'Your positive mood days show 40% higher task completion rates.'
    },
    {
      type: 'growth',
      icon: '🌱',
      title: 'Growth Insight',
      content: 'Your focus sessions have improved by 25% over the past week.'
    },
    {
      type: 'suggestion',
      icon: '💡',
      title: 'Suggestion',
      content: 'Try scheduling important tasks during your peak energy hours.'
    },
    {
      type: 'streak',
      icon: '🔥',
      title: 'Consistency',
      content: 'You\'ve maintained a 7-day journaling streak. Keep it up!'
    }
  ];

  const saveEntry = () => {
    if (newContent.trim()) {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        content: newContent.trim(),
        mood: selectedMood,
        tags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };
      
      setEntries([entry, ...entries]);
      setNewContent('');
      setSelectedMood('');
      setNewTags('');
      setShowNewEntry(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>📖 Journal</Text>
          <TouchableOpacity
            onPress={() => setShowNewEntry(true)}
            style={styles.addButton}
          >
            <Icon name="plus" size={20} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* AI Insights */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
          <Text style={styles.cardTitle}>🧠 AI Insights (5)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.insightsContainer}>
              {aiInsights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightContent}>{insight.content}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Journal Entries */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.entriesContainer}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySubtitle}>
                Start journaling to track your thoughts and progress
              </Text>
            </View>
          ) : (
            entries.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInUp.delay(400 + index * 100)}
                style={styles.entryCard}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryDate}>
                    <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
                    {entry.mood && (
                      <Text style={styles.moodEmoji}>{entry.mood}</Text>
                    )}
                  </View>
                  <TouchableOpacity>
                    <Icon name="more-horizontal" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.entryContent}>{entry.content}</Text>
                
                {entry.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {entry.tags.map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* New Entry Modal */}
      <Modal
        visible={showNewEntry}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewEntry(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Entry</Text>
            <TouchableOpacity onPress={saveEntry}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>How was your day?</Text>
            <TextInput
              style={styles.contentInput}
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Write about your thoughts, feelings, and experiences..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>😊 Mood</Text>
            <View style={styles.moodSelector}>
              {moods.map((mood, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedMood(mood.emoji);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.moodButton,
                    selectedMood === mood.emoji && styles.selectedMoodButton
                  ]}
                >
                  <Text style={styles.moodButtonEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodButtonLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>🏷️ Tags</Text>
            <TextInput
              style={styles.tagsInput}
              value={newTags}
              onChangeText={setNewTags}
              placeholder="work, productive, focus (comma separated)"
              placeholderTextColor="#9ca3af"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  addButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  insightsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    width: 200,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  insightIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  insightContent: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  entriesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  moodEmoji: {
    fontSize: 16,
    marginLeft: 8,
  },
  entryContent: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 20,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
    backgroundColor: '#f9fafb',
  },
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 70,
  },
  selectedMoodButton: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  moodButtonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodButtonLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tagsInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
});