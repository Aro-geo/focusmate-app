import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Trash2, Filter, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { journalInsightsService, JournalInsight } from '../services/JournalInsightsService';

interface JournalInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JournalInsightsModal: React.FC<JournalInsightsModalProps> = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const [insights, setInsights] = useState<JournalInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<JournalInsight['category'] | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInsight, setNewInsight] = useState({
    title: '',
    content: '',
    category: 'takeaways' as JournalInsight['category']
  });

  const categories = [
    { value: 'all', label: 'All Insights' },
    { value: 'patterns', label: 'Patterns' },
    { value: 'takeaways', label: 'Key Takeaways' },
    { value: 'reflections', label: 'Reflections' },
    { value: 'improvements', label: 'Improvements' },
    { value: 'goals', label: 'Goals' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadInsights();
    }
  }, [isOpen]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const allInsights = await journalInsightsService.getInsights();
      setInsights(allInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteInsight = async (insightId: string) => {
    try {
      await journalInsightsService.deleteInsight(insightId);
      setInsights(prev => prev.filter(insight => insight.id !== insightId));
    } catch (error) {
      console.error('Error deleting insight:', error);
    }
  };

  const saveNewInsight = async () => {
    if (!newInsight.title.trim() || !newInsight.content.trim()) return;

    try {
      await journalInsightsService.saveInsight({
        ...newInsight,
        sessionDate: new Date(),
        entryIds: []
      });
      setNewInsight({ title: '', content: '', category: 'takeaways' });
      setShowAddForm(false);
      loadInsights();
    } catch (error) {
      console.error('Error saving insight:', error);
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

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

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Lightbulb className="mr-2" size={24} />
              Journal Insights
            </h2>
            <button
              onClick={() => setShowAddForm(true)}
              className={`flex items-center px-3 py-2 rounded-lg ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Plus size={16} className="mr-2" />
              Add Insight
            </button>
          </div>

          {/* Add New Insight Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-6 p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newInsight.title}
                    onChange={(e) => setNewInsight({...newInsight, title: e.target.value})}
                    placeholder="Insight title..."
                    className={`w-full p-3 rounded-lg border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <textarea
                    value={newInsight.content}
                    onChange={(e) => setNewInsight({...newInsight, content: e.target.value})}
                    placeholder="Describe your insight..."
                    rows={3}
                    className={`w-full p-3 rounded-lg border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <div className="flex items-center space-x-3">
                    <select
                      value={newInsight.category}
                      onChange={(e) => setNewInsight({...newInsight, category: e.target.value as JournalInsight['category']})}
                      className={`p-2 rounded-lg border ${
                        darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      {categories.slice(1).map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={saveNewInsight}
                      className={`px-4 py-2 rounded-lg ${
                        darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className={`px-4 py-2 rounded-lg ${
                        darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Insights List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading insights...</div>
            ) : filteredInsights.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">
                  {selectedCategory === 'all' 
                    ? 'No insights recorded yet. Start adding your key takeaways and reflections!'
                    : `No insights found in the ${categories.find(c => c.value === selectedCategory)?.label} category.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInsights.map(insight => (
                  <motion.div
                    key={insight.id}
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
                          {categories.find(c => c.value === insight.category)?.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {insight.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteInsight(insight.id!)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {insight.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {insight.content}
                    </p>
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

export default JournalInsightsModal;