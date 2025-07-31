import React from 'react';
import supabaseClient from '../services/SupabaseClient';

interface Todo {
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

  // Initialize connection to Supabase database
  const initConnection = React.useCallback(async () => {
    try {
      // Get auth token from storage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      // Test connection
      const success = await supabaseClient.testConnection();
      if (!success) {
        throw new Error('Failed to connect to database');
      }

      return true;
    } catch (err: any) {
      console.error('Database connection initialization error:', err);
      setError(err.message || 'Failed to connect to database');
      return false;
    }
  }, []);

  // Fetch todos from database
  const fetchTodos = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const connectionOk = await initConnection();
      if (!connectionOk) {
        return;
      }

      // Get current user ID from token or user data
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      // Fetch todos for the current user
      const todosData = await supabaseClient.query('todos', {
        select: '*',
        eq: { user_id: userId },
        order: { column: 'created_at', ascending: false }
      });

      setTodos(todosData || []);
    } catch (err: any) {
      console.error('Error fetching todos:', err);
      setError(err.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, [initConnection]);

  // Add a new todo
  const addTodo = React.useCallback(async (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      setError(null);

      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const newTodo = {
        ...todo,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await supabaseClient.insert('todos', newTodo);
      
      if (result && result.length > 0) {
        setTodos(prev => [result[0], ...prev]);
      }
    } catch (err: any) {
      console.error('Error adding todo:', err);
      setError(err.message || 'Failed to add todo');
    }
  }, []);

  // Update a todo
  const updateTodo = React.useCallback(async (id: number, updates: Partial<Todo>) => {
    try {
      setError(null);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const result = await supabaseClient.update('todos', updateData, { id });
      
      if (result && result.length > 0) {
        setTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, ...result[0] } : todo
        ));
      }
    } catch (err: any) {
      console.error('Error updating todo:', err);
      setError(err.message || 'Failed to update todo');
    }
  }, []);

  // Delete a todo
  const deleteTodo = React.useCallback(async (id: number) => {
    try {
      setError(null);

      await supabaseClient.delete('todos', { id });
      
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

      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const updateData = {
        completed: !todo.completed,
        updated_at: new Date().toISOString()
      };

      const result = await supabaseClient.update('todos', updateData, { id });
      
      if (result && result.length > 0) {
        setTodos(prev => prev.map(t => 
          t.id === id ? { ...t, ...result[0] } : t
        ));
      }
    } catch (err: any) {
      console.error('Error toggling todo:', err);
      setError(err.message || 'Failed to toggle todo');
    }
  }, [todos]);

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
