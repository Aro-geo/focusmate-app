import React from 'react';
import TodoManager from '../components/TodoManager';

export default function TodoList() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-900 dark:text-white">Todo List</h1>

      <TodoManager />
    </div>
  );
}
