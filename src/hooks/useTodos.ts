import React from 'react';
import TaskApiService from '../services/TaskApiService';

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateTodo: (id: number, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  refreshTodos: () => Promise<void>;
}

// Custom hook for Todo operations
export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Check authentication
  const checkAuth = React.useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Not authenticated. Please login first.');
      return false;
    }
    return true;
  }, []);

  // Fetch todos from API
  const fetchTodos = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!checkAuth()) {
        return;
      }

      const todosData = await TaskApiService.getTasks();
      setTodos(todosData);
    } catch (err: any) {
      console.error('Error fetching todos:', err);
      setError(err.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  // Add a new todo
  const addTodo = React.useCallback(async (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      setError(null);

      if (!checkAuth()) {
        return;
      }

      const newTask = await TaskApiService.addTask(todo.title, todo.priority);
      setTodos(prev => [newTask, ...prev]);
    } catch (err: any) {
      console.error('Error adding todo:', err);
      setError(err.message || 'Failed to add todo');
    }
  }, [checkAuth]);

  // Update a todo
  const updateTodo = React.useCallback(async (id: number, updates: Partial<Todo>) => {
    try {
      setError(null);
      // For now, just update locally - can implement API call later
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, ...updates, updated_at: new Date().toISOString() } : todo
      ));
    } catch (err: any) {
      console.error('Error updating todo:', err);
      setError(err.message || 'Failed to update todo');
    }
  }, []);

  // Delete a todo
  const deleteTodo = React.useCallback(async (id: number) => {
    try {
      setError(null);
      // For now, just delete locally - can implement API call later
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      setError(err.message || 'Failed to delete todo');
    }
  }, []);

  // Toggle todo completion status
  const toggleTodo = React.useCallback(async (id: number) => {
    try {
      setError(null);

      if (!checkAuth()) {
        return;
      }

      const updatedTask = await TaskApiService.toggleTask(id);
      setTodos(prev => prev.map(t => 
        t.id === id ? updatedTask : t
      ));
    } catch (err: any) {
      console.error('Error toggling todo:', err);
      setError(err.message || 'Failed to toggle todo');
    }
  }, [checkAuth]);

  // Refresh todos
  const refreshTodos = React.useCallback(async () => {
    await fetchTodos();
  }, [fetchTodos]);

  // Load todos on mount
  React.useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refreshTodos
  };
}
