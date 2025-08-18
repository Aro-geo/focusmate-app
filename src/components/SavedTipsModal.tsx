import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Trash2, Filter } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { aiFocusTipsService, AIFocusTip } from '../services/AIFocusTipsService';
import FormattedMessage from './FormattedMessage';

interface SavedTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SavedTipsModal: React.FC<SavedTipsModalProps> = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const [tips, setTips] = useState<AIFocusTip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AIFocusTip['category'] | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'all', label: 'All Tips' },
    { value: 'time-management', label: 'Time Management' },
    { value: 'motivation', label: 'Motivation' },
    { value: 'break-strategies', label: 'Break Strategies' },
    { value: 'focus-techniques', label: 'Focus Techniques' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadTips();
    }
  }, [isOpen]);

  const loadTips = async () => {
    setLoading(true);
    try {
      const allTips = await aiFocusTipsService.getTips();
      setTips(allTips);
    } catch (error) {
      console.error('Error loading tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTip = async (tipId: string) => {
    try {
      await aiFocusTipsService.deleteTip(tipId);
      setTips(prev => prev.filter(tip => tip.id !== tipId));
    } catch (error) {
      console.error('Error deleting tip:', error);
    }
  };

  const filteredTips = selectedCategory === 'all' 
    ? tips 
    : tips.filter(tip => tip.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative max-w-4xl w-full rounded-2xl p-6 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } shadow-2xl max-h-[80vh] overflow-hidden flex flex-col`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <BookOpen className="mr-2" size={24} />
            Saved Focus Tips
          </h2>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Filter size={16} />
              <span className="text-sm font-medium">Filter by category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value as any)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category.value
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                      : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tips List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading tips...</div>
            ) : filteredTips.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">
                  {selectedCategory === 'all' 
                    ? 'No saved tips yet. Start saving helpful AI tips during your Pomodoro sessions!'
                    : `No tips found in the ${categories.find(c => c.value === selectedCategory)?.label} category.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTips.map(tip => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {categories.find(c => c.value === tip.category)?.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {tip.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTip(tip.id!)}
                        className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <FormattedMessage
                      message={tip.content}
                      className={`text-sm leading-relaxed ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SavedTipsModal;