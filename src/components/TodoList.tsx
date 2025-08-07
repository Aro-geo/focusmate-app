import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import firestoreService from '../services/FirestoreService';

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export function TodoList() {
  const { user } = useAuth();
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
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const todosData = await firestoreService.getTasks();
        setTodos(todosData.map(task => ({
          id: task.id!,
          title: task.title,
          description: task.description,
          completed: task.completed,
          priority: task.priority as 'low' | 'medium' | 'high',
          due_date: task.dueDate,
          created_at: task.createdAt,
          updated_at: task.updatedAt
        })));
      } catch (err: any) {
        console.error('Error loading todos:', err);
        setError(err.message || 'Failed to load todos');
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, [user]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodo.title.trim() || !user) return;

    try {
      const taskData = {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || '',
        priority: newTodo.priority,
        dueDate: newTodo.due_date || '',
        completed: false
      };

      const taskId = await firestoreService.addTask(
        taskData.title, 
        taskData.priority, 
        taskData.description, 
        taskData.dueDate
      );
      const newTask = {
        id: taskId,
        title: taskData.title,
        description: taskData.description,
        completed: taskData.completed,
        priority: taskData.priority,
        due_date: taskData.dueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setTodos(prev => [newTask, ...prev]);
      
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        due_date: ''
      });
    } catch (err: any) {
      console.error('Error adding todo:', err);
      setError(err.message || 'Failed to add todo');
    }
  };

  const toggleTodo = async (id: string) => {
    if (!user) return;
    
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      await firestoreService.updateTask(id, {
        completed: !todo.completed
      });
      
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed, updated_at: new Date().toISOString() } : t
      ));
    } catch (err: any) {
      console.error('Error toggling todo:', err);
      setError(err.message || 'Failed to toggle todo');
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    
    try {
      await firestoreService.deleteTask(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      setError(err.message || 'Failed to delete todo');
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        Please log in to view your todos.
      </div>
    );
  }

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
