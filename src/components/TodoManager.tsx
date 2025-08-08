import * as React from 'react';
import { useTodos } from '../hooks/useTodos';
import { useTheme } from '../context/ThemeContext';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

// Create a TodoManager component that uses our custom hook
export default function TodoManager() {
  const { todos, loading, error: todoError, addTodo, toggleTodo, deleteTodo, refreshTodos } = useTodos();
  const { darkMode } = useTheme();
  const [newTask, setNewTask] = React.useState('');
  const [error, setError] = React.useState<string | null>(todoError);
  
  // Update local error state when the hook's error changes
  React.useEffect(() => {
    setError(todoError);
  }, [todoError]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTodo({
        title: newTask.trim(),
        completed: false,
        priority: 'medium'
      });
      setNewTask('');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mx-4">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Todo List</h2>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
          {error}
          <button 
            className="ml-2 text-red-500 font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Add todo form */}
      <form onSubmit={handleSubmit} className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          aria-label="New task"
          className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg sm:rounded-l-none sm:rounded-r-lg hover:bg-blue-600"
        >
          Add
        </button>
      </form>
      
      {/* Todo list */}
      {loading ? (
        <div className="text-center py-4 text-gray-900 dark:text-white">Loading...</div>
      ) : todos.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">No tasks yet. Add one to get started!</div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-between bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="mr-3"
                  aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                />
                <span className={todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}>
                  {todo.title}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Delete task "${todo.title}"`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
