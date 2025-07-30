import { Task, NewTask } from '../models/Task';
import BaseApiService from './BaseApiService';
import axios from 'axios';

interface TasksResponse {
  tasks: Task[];
  total?: number;
}

interface TaskResponse {
  task: Task;
}

interface TasksApiResponse {
  success: boolean;
  task?: Task;
  tasks?: Task[];
  message?: string;
}

/**
 * Service for task-related operations (real API integration)
 */
export const TaskService = {
  /**
   * Get all tasks for the current user
   */
  async getAllForUser(): Promise<Task[]> {
    const result = await BaseApiService.get<TasksResponse>('tasks');
    
    if (result.success && result.data) {
      return result.data.tasks;
    }
    
    console.error('Error fetching tasks:', result.message);
    return [];
  },

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task | null> {
    const result = await BaseApiService.get<TaskResponse>(`tasks?id=${id}`);
    
    if (result.success && result.data) {
      return result.data.task;
    }
    
    console.error('Error fetching task:', result.message);
    return null;
  },

  /**
   * Create a new task
   */
  async create(task: NewTask): Promise<Task> {
    const result = await BaseApiService.post<{ task: Task }>('tasks', {
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      due_date: task.due_date
    });
    
    if (result.success && result.data?.task) {
      return result.data.task;
    }
    
    throw new Error(result.message || 'Failed to create task');
  },

  /**
   * Update a task
   */
  async update(id: number, task: Partial<Task>): Promise<Task | null> {
    const result = await BaseApiService.put<{ task: Task }>(`tasks/${id}`, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      completed_at: task.completed ? new Date().toISOString() : null
    });
    
    if (result.success && result.data?.task) {
      return result.data.task;
    }
    
    console.error('Error updating task:', result.message);
    return null;
  },

  /**
   * Delete a task
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await BaseApiService.delete<TasksApiResponse>('tasks', { id });
      
      return result.success || false;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  },

  /**
   * Mark task as completed
   */
  async markCompleted(id: number, completed: boolean = true): Promise<Task | null> {
    return this.update(id, { 
      completed, 
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date() : undefined
    });
  }
};
