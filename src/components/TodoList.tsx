'use client';

import React, { useState, useEffect } from 'react';
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

export function TodoList() {
  const [todos, setTodos] = useState<Array<Todo>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodo, setNewTodo] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    async function loadTodos() {
      setLoading(true);
      setError(null);
      
      try {
        // Get token from localStorage (where your auth service stores it)
        const token = localStorage.getItem('token');

        if (!token) {
          setError("Not authenticated. Please login first.");
          setLoading(false);
          return;
        }

        // Get current user ID
        const userData = localStorage.getItem('user');
        if (!userData) {
          setError("User data not found. Please login again.");
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        const userId = user.id;

        // Fetch todos for the current user
        const todosData = await supabaseClient.query('todos', {
          select: '*',
          eq: { user_id: userId },
          order: { column: 'created_at', ascending: false }
        });
        
        // Update state with todos
        if (Array.isArray(todosData) && todosData.every(item => item && typeof item === 'object' && 'id' in item)) {
          setTodos(todosData as unknown as Todo[]);
        } else {
          console.error('Invalid todos response:', todosData);
          setError('Failed to load todos');
          setTodos([]);
        }
      } catch (err: any) {
        console.error('Error loading todos:', err);
        setError(err.message || 'Failed to load todos');
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) return;

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("User data not found. Please login again.");
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const todoData = {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || null,
        priority: newTodo.priority,
        due_date: newTodo.due_date || null,
        completed: false,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await supabaseClient.insert('todos', todoData);
      
      if (result && result.length > 0) {
        setTodos(prev => [result[0] as Todo, ...prev]);
        setNewTodo({
          title: '',
          description: '',
          priority: 'medium',
          due_date: ''
        });
      }
    } catch (err: any) {
      console.error('Error adding todo:', err);
      setError(err.message || 'Failed to add todo');
    }
  };

  const toggleTodo = async (id: number) => {
    try {
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
  };

  const deleteTodo = async (id: number) => {
    try {
      await supabaseClient.delete('todos', { id });
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      setError(err.message || 'Failed to delete todo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Todo List</h1>
      
      {/* Add Todo Form */}
      <form onSubmit={addTodo} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTodo.title}
              onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <select
              value={newTodo.priority}
              onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Todo
            </button>
          </div>
        </div>
        <div className="mt-4">
          <textarea
            placeholder="Description (optional)"
            value={newTodo.description}
            onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
          />
        </div>
        <div className="mt-4">
          <input
            type="date"
            value={newTodo.due_date}
            onChange={(e) => setNewTodo(prev => ({ ...prev, due_date: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Todo List */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No todos yet. Add your first todo above!
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                todo.completed ? 'border-green-500 opacity-75' : 
                todo.priority === 'high' ? 'border-red-500' :
                todo.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <h3 className={`text-lg font-medium ${
                      todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {todo.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                      todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {todo.priority}
                    </span>
                  </div>
                  {todo.description && (
                    <p className={`mt-2 text-gray-600 ${
                      todo.completed ? 'line-through' : ''
                    }`}>
                      {todo.description}
                    </p>
                  )}
                  {todo.due_date && (
                    <p className={`mt-2 text-sm ${
                      new Date(todo.due_date) < new Date() && !todo.completed ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      Due: {new Date(todo.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
