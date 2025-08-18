import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Animated, { 
  FadeInRight, 
  FadeOutLeft,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface TasksPreviewProps {
  completedTasks: number;
  totalTasks: number;
  onTaskUpdate: (completed: number, total: number) => void;
}

export default function TasksPreview({ completedTasks, totalTasks, onTaskUpdate }: TasksPreviewProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review project proposal', completed: true, priority: 'high' },
    { id: '2', title: 'Update presentation slides', completed: false, priority: 'medium' },
    { id: '3', title: 'Team meeting preparation', completed: false, priority: 'low' },
  ]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        priority: 'medium',
      };
      
      const updatedTasks = [...tasks, task];
      setTasks(updatedTasks);
      setNewTask('');
      
      const completed = updatedTasks.filter(t => t.completed).length;
      onTaskUpdate(completed, updatedTasks.length);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    
    setTasks(updatedTasks);
    
    const completed = updatedTasks.filter(t => t.completed).length;
    onTaskUpdate(completed, updatedTasks.length);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const deleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTasks = tasks.filter(task => task.id !== id);
            setTasks(updatedTasks);
            
            const completed = updatedTasks.filter(t => t.completed).length;
            onTaskUpdate(completed, updatedTasks.length);
            
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Today's Tasks</Text>
        <Text style={styles.counter}>({completedTasks}/{totalTasks})</Text>
      </View>

      {/* AI Suggestion */}
      <View style={styles.aiSuggestion}>
        <Icon name="zap" size={16} color="#6366f1" />
        <Text style={styles.aiText}>
          AI: "Start with high priority tasks for better focus"
        </Text>
      </View>

      {/* Add Task Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add new task..."
          placeholderTextColor="#9ca3af"
          onSubmitEditing={addTask}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addTask} style={styles.addButton}>
          <Icon name="plus" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <View style={styles.tasksList}>
        {tasks.slice(0, 3).map((task) => (
          <Animated.View
            key={task.id}
            entering={FadeInRight}
            exiting={FadeOutLeft}
            layout={Layout.springify()}
            style={[
              styles.taskItem,
              task.completed && styles.completedTask
            ]}
          >
            <TouchableOpacity
              onPress={() => toggleTask(task.id)}
              style={styles.taskContent}
            >
              <View style={styles.taskLeft}>
                <View style={[
                  styles.checkbox,
                  task.completed && styles.checkedBox
                ]}>
                  {task.completed && (
                    <Icon name="check" size={16} color="#ffffff" />
                  )}
                </View>
                <View style={styles.taskInfo}>
                  <Text style={[
                    styles.taskTitle,
                    task.completed && styles.completedText
                  ]}>
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <Text style={styles.priorityIcon}>
                      {getPriorityIcon(task.priority)}
                    </Text>
                    <Text style={styles.priorityText}>
                      {task.priority} priority
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => deleteTask(task.id)}
              style={styles.deleteButton}
            >
              <Icon name="trash-2" size={16} color="#ef4444" />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {tasks.length > 3 && (
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View all {tasks.length} tasks</Text>
          <Icon name="arrow-right" size={16} color="#6366f1" />
        </TouchableOpacity>
      )}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  counter: {
    fontSize: 14,
    color: '#6b7280',
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  aiText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  addButton: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksList: {
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  completedTask: {
    opacity: 0.6,
  },
  taskContent: {
    flex: 1,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkedBox: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    marginRight: 4,
  },
});