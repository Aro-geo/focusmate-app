import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  Calendar,
  FileText,
  Save,
  Trash2,
  PlusCircle,
  Brain,
  Search,
  Download,
  Lightbulb,
  Tag,
  X,
  Upload,
  Image,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import FloatingAssistant from '../components/FloatingAssistant';
import JournalInsightsModal from '../components/JournalInsightsModal';
import SecureFirestoreService, { SecureJournalEntry } from '../services/SecureFirestoreService';
import JournalAIService from '../services/JournalAIService';
import JournalAttachmentService from '../services/JournalAttachmentService';
import { exportService } from '../services/ExportService';
import { aiJournalInsightsService, AIInsight as AIJournalInsight } from '../services/AIJournalInsightsService';
import { journalInsightsService } from '../services/JournalInsightsService';
import { useAuth } from '../context/AuthContext';
import { Timestamp } from 'firebase/firestore';

// Define interfaces for the app
interface JournalStreak {
  current: number;
  longest: number;
  lastEntryDate: string;
}

interface JournalStats {
  totalEntries: number;
  moodCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  averageSentiment: number;
  streak: JournalStreak;
  entriesByDate: Record<string, number>;
}

interface AIInsight {
  type: string;
  content: string;
  confidence?: number;
}

const Journal: React.FC = () => {
  const { darkMode } = useTheme();
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log authentication state to help debug
  useEffect(() => {
    console.log('Auth state in Journal:', {
      userExists: !!user,
      firebaseUserExists: !!firebaseUser,
      isAuthenticated,
      userId: user?.id,
      firebaseUid: firebaseUser?.uid
    });
  }, [user, firebaseUser, isAuthenticated]);


  // Mood emojis mapping
  const moodEmojis = {
    'excited': '🤩',
    'happy': '😊',
    'neutral': '😐',
    'tired': '😴',
    'frustrated': '😤',
    'sad': '😢',
    'productive': '💪',
    'creative': '🎨',
    'reflective': '🤔',
    'grateful': '🙏'
  };

  // Auto-suggestions
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([
    "What went well today?",
    "What could I improve tomorrow?",
    "What am I grateful for?",
    "What challenges did I face?",
    "What did I learn today?",
    "How did I feel during work sessions?",
    "What motivated me today?",
    "What distracted me the most?"
  ]);

  // Entry templates
  const entryTemplates = [
    {
      name: "Gratitude Journal",
      description: "Focus on things you're thankful for",
      template: "Today, I am grateful for:\n\n1. \n2. \n3. \n\nWhy these matter to me: "
    },
    {
      name: "Work Reflection",
      description: "Analyze your productivity and achievements",
      template: "Tasks completed today:\n\nChallenges faced:\n\nWhat I learned:\n\nPlan for tomorrow: "
    },
    {
      name: "Emotional Check-in",
      description: "Process your feelings and emotions",
      template: "My current mood: \n\nWhat contributed to this feeling: \n\nHow I want to feel tomorrow: \n\nOne step I can take: "
    },
    {
      name: "Problem-Solving",
      description: "Work through a challenge systematically",
      template: "Challenge I'm facing: \n\nPossible causes: \n\nPotential solutions: \n\n- \n- \n- \n\nNext steps: "
    }
  ];

  // State management
  const [entries, setEntries] = useState<SecureJournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<JournalStats | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentEntry, setCurrentEntry] = useState<string>('');
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentMood, setCurrentMood] = useState<string>('neutral');
  const [currentTags, setCurrentTags] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [showCalendarFilter, setShowCalendarFilter] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState<boolean>(false);
  const [currentAttachments, setCurrentAttachments] = useState<string[]>([]);
  const [isPrivateEntry, setIsPrivateEntry] = useState<boolean>(false);
  const [showEntryTemplates, setShowEntryTemplates] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Streak tracking
  const [streak, setStreak] = useState<JournalStreak>({
    current: 0,
    longest: 0,
    lastEntryDate: ''
  });

  // AI Assistant state
  const [aiMessage, setAiMessage] = useState<string>("Ready to help you reflect on your thoughts and experiences! Ask me about journaling techniques or insights.");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>('');
  const [aiInsights, setAiInsights] = useState<AIJournalInsight[]>([]);
  const [isGeneratingAIInsights, setIsGeneratingAIInsights] = useState<boolean>(false);
  const [showAIInsights, setShowAIInsights] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showInsightsModal, setShowInsightsModal] = useState<boolean>(false);

  // Filtered entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesMood = selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;
    const matchesTag = selectedTagFilter === 'all' || (entry.tags && entry.tags.includes(selectedTagFilter));

    return matchesSearch && matchesMood && matchesTag;
  });

  // Get unique tags for filter
  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags || [])));

  // Load journal entries and stats
  useEffect(() => {
    if (!firebaseUser || !isAuthenticated) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get journal entries
        const journalEntries = await SecureFirestoreService.getJournalEntries(firebaseUser.uid);
        setEntries(journalEntries);

        // Get journal stats
        const journalStats = await SecureFirestoreService.getJournalStats(firebaseUser.uid);
        setStats(journalStats);
        setStreak(journalStats.streak);

        // AI insights will be generated on demand
      } catch (err) {
        console.error('Error loading journal data:', err);
        setError('Failed to load journal entries. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [firebaseUser, isAuthenticated]);

  // Functions
  const handleSaveEntry = async () => {
    // More detailed auth check and logging
    if (!firebaseUser || !isAuthenticated) {
      console.error('Auth validation failed:', {
        userExists: !!user,
        firebaseUserExists: !!firebaseUser,
        isAuthenticated
      });
      setError('You must be logged in to save entries. Please try logging in again if this persists.');
      return;
    }

    if (!currentEntry.trim()) {
      setError('Please write something before saving your entry.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create the journal entry object
      const newEntry: Partial<SecureJournalEntry> = {
        title: currentTitle.trim() || `Entry ${new Date().toLocaleDateString()}`,
        content: currentEntry.trim(),
        mood: currentMood,
        tags: currentTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        attachments: currentAttachments,
        isPrivate: isPrivateEntry,
        userId: firebaseUser.uid
      };

      // Save to database
      const entryId = await SecureFirestoreService.addJournalEntry(newEntry, firebaseUser.uid);

      // Analyze sentiment with AI
      const fullEntry = {
        ...newEntry,
        id: entryId
      } as SecureJournalEntry;

      await JournalAIService.updateJournalSentiment(fullEntry, firebaseUser.uid);

      // Refresh entries
      const journalEntries = await SecureFirestoreService.getJournalEntries(firebaseUser.uid);
      setEntries(journalEntries);

      // Update stats
      const journalStats = await SecureFirestoreService.getJournalStats(firebaseUser.uid);
      setStats(journalStats);
      setStreak(journalStats.streak);

      // Reset form
      setCurrentEntry('');
      setCurrentTitle('');
      setCurrentMood('neutral');
      setCurrentTags('');
      setCurrentAttachments([]);
      setIsPrivateEntry(false);

      // Auto-generate insight from entry
      const insightData = journalInsightsService.generateInsightFromEntry(currentEntry, entryId);
      if (insightData) {
        try {
          await journalInsightsService.saveInsight({
            ...insightData,
            sessionDate: new Date(),
            entryIds: [entryId]
          });
        } catch (err) {
          console.error('Error saving auto-generated insight:', err);
        }
      }

      // Show success message
      alert('Journal entry saved successfully!');
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save your journal entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Simple sentiment analysis function (mock)
  const analyzeSentiment = (text: string): number => {
    // This is a simplified mock - in real app, use NLP API
    const positiveWords = ['happy', 'great', 'excellent', 'good', 'positive', 'excited', 'productive', 'success'];
    const negativeWords = ['sad', 'bad', 'difficult', 'hard', 'negative', 'frustrated', 'tired', 'fail'];

    let score = 0;
    const words = text.toLowerCase().split(/\W+/);

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.2;
      if (negativeWords.includes(word)) score -= 0.2;
    });

    return Math.max(-1, Math.min(1, score)); // Clamp between -1 and 1
  };

  const getSentimentAnalysis = (score: number): string => {
    if (score > 0.5) return "Very positive entry! Your writing shows enthusiasm and optimism.";
    if (score > 0.2) return "Positive tone detected. You seem to be in a good mood.";
    if (score > -0.2) return "Neutral writing tone. You're being balanced and objective.";
    if (score > -0.5) return "Slightly negative tone. Consider reflection on what's troubling you.";
    return "Your entry seems quite negative. Consider writing about solutions or seeking support.";
  };

  const updateStreak = (entryDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (entryDate === today) {
      // If last entry was yesterday, increment streak
      if (streak.lastEntryDate === yesterday) {
        const newCurrent = streak.current + 1;
        setStreak({
          current: newCurrent,
          longest: Math.max(newCurrent, streak.longest),
          lastEntryDate: today
        });
      }
      // If streak broken but writing today
      else if (streak.lastEntryDate !== today) {
        setStreak({
          current: 1,
          longest: streak.longest,
          lastEntryDate: today
        });
      }
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    if (!firebaseUser || !isAuthenticated) {
      console.error('Auth validation failed for delete:', {
        userExists: !!user,
        firebaseUserExists: !!firebaseUser,
        isAuthenticated
      });
      setError('You must be logged in to delete entries. Please try logging in again if this persists.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get the entry to check for attachments
      const entryToDelete = entries.find(entry => entry.id === id);

      // Delete any attachments from storage
      if (entryToDelete?.attachments && entryToDelete.attachments.length > 0) {
        for (const attachmentUrl of entryToDelete.attachments) {
          try {
            await JournalAttachmentService.deleteImage(attachmentUrl, firebaseUser.uid);
          } catch (err) {
            console.error('Error deleting attachment:', err);
            // Continue with entry deletion even if attachment deletion fails
          }
        }
      }

      // Delete the entry
      await SecureFirestoreService.deleteJournalEntry(id, firebaseUser.uid);

      // Update local state
      setEntries(entries.filter(entry => entry.id !== id));

      // Update stats
      const journalStats = await SecureFirestoreService.getJournalStats(firebaseUser.uid);
      setStats(journalStats);
      setStreak(journalStats.streak);

    } catch (err) {
      console.error('Error deleting journal entry:', err);
      setError('Failed to delete the journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate insights
  const handleGenerateInsight = async () => {
    if (!firebaseUser || !isAuthenticated || entries.length === 0) {
      console.error('Auth validation failed for insights:', {
        userExists: !!user,
        firebaseUserExists: !!firebaseUser,
        isAuthenticated,
        entriesCount: entries.length
      });
      setError('You need to be logged in and have journal entries to generate insights.');
      return;
    }

    try {
      setIsGeneratingAIInsights(true);
      setError(null);

      // Convert entries to the format expected by AI service
      const journalEntries = entries.map(entry => ({
        id: entry.id || `entry-${Date.now()}-${Math.random()}`,
        title: entry.title || '',
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags || [],
        createdAt: entry.createdAt instanceof Timestamp ? entry.createdAt.toDate() : new Date(entry.createdAt),
        updatedAt: entry.updatedAt instanceof Timestamp ? entry.updatedAt.toDate() : new Date(entry.updatedAt)
      }));

      console.log('Generating insights for', journalEntries.length, 'entries');

      // Generate comprehensive AI insights
      const insights = await aiJournalInsightsService.generateInsights(journalEntries);

      console.log('Generated insights:', insights.length, 'insights');
      console.log('Insights:', insights);

      setAiInsights(insights);
      setShowAIInsights(true);

      // Display the highest confidence insight as the main insight
      if (insights.length > 0) {
        const topInsight = insights[0]; // Already sorted by confidence
        setAiInsight(topInsight.description);
        console.log('Top insight:', topInsight);
      } else {
        setAiInsight("Keep journaling! With more entries, I'll be able to provide deeper insights about your patterns and progress.");
        console.log('No insights generated');
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again later.');
    } finally {
      setIsGeneratingAIInsights(false);
    }
  };

  // Export journal entries to PDF
  const handleExportPDF = async () => {
    if (!firebaseUser || !isAuthenticated || entries.length === 0) {
      setError('You must be logged in and have journal entries to export.');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);

      // TODO: Implement PDF export - temporarily disabled due to type issues
      alert('PDF export feature coming soon!');
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setError('Failed to export to PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export journal entries to DOCX
  const handleExportDOCX = async () => {
    if (!firebaseUser || !isAuthenticated || entries.length === 0) {
      setError('You must be logged in and have journal entries to export.');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);

      // TODO: Implement DOCX export - temporarily disabled due to type issues
      alert('DOCX export feature coming soon!');
    } catch (err) {
      console.error('Error exporting to DOCX:', err);
      setError('Failed to export to DOCX. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Apply template to entry
  const applyTemplate = (template: string) => {
    setCurrentEntry(template);
    setShowEntryTemplates(false);
  };

  // Handle file attachment
  const handleAttachment = () => {
    // More detailed auth check and logging
    if (!firebaseUser || !isAuthenticated) {
      console.error('Auth validation failed for attachment:', {
        userExists: !!user,
        firebaseUserExists: !!firebaseUser,
        isAuthenticated
      });
      setError('You must be logged in to add attachments. Please try logging in again if this persists.');
      return;
    }

    // Create a file input and trigger it
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    // More detailed auth check and logging
    if (!firebaseUser || !isAuthenticated) {
      console.error('Auth validation failed for file upload:', {
        userExists: !!user,
        firebaseUserExists: !!firebaseUser,
        isAuthenticated,
        firebaseUid: firebaseUser?.uid
      });
      setError('You must be logged in to add attachments. Please try logging in again if this persists.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setFileError(null);

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File is too large. Maximum size is 5MB.');
        return;
      }

      console.log('Uploading file with UID:', firebaseUser.uid);

      // Upload file to storage
      const downloadUrl = await JournalAttachmentService.uploadImage(file, firebaseUser.uid);
      console.log('File uploaded successfully, URL:', downloadUrl.substring(0, 50) + '...');

      // Add URL to attachments
      setCurrentAttachments([...currentAttachments, downloadUrl]);

    } catch (err) {
      console.error('Error uploading attachment:', err);
      setFileError(`Failed to upload attachment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingFile(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // AI Assistant functions
  const handleAskAI = async () => {
    if (!aiChatInput.trim()) return;

    try {
      setIsAiLoading(true);
      setError(null);

      // Store the user's question for reference
      const userQuestion = aiChatInput;
      setAiChatInput('');

      // Define possible responses based on keywords in the question
      const responses = {
        journal: [
          "Regular journaling can help improve self-awareness and emotional regulation. Try to write consistently, even if just for a few minutes each day.",
          "Studies show that journaling can reduce stress and anxiety by helping process emotions and clarify thoughts.",
          "For effective journaling, try different formats - free writing, structured prompts, or gratitude lists to see what works best for you."
        ],
        mood: [
          "Tracking your mood over time can reveal patterns and triggers that affect your emotional state.",
          "Consider noting factors that influence your mood alongside your entries - sleep, exercise, nutrition, and social interactions often play a key role.",
          "Identifying mood patterns in your journal can help you make lifestyle adjustments to improve your overall wellbeing."
        ],
        productivity: [
          "Journaling about your work can help identify when and why you're most productive, allowing you to optimize your schedule.",
          "Try the 'Done List' technique - record completed tasks rather than just planning future ones. This builds momentum and motivation.",
          "Reflecting on your productive periods can help you replicate those conditions and improve your focus over time."
        ],
        default: [
          "I'm here to help with your journaling practice. Try asking about specific techniques or ways to get more insights from your entries.",
          "Regular reflection through journaling can lead to valuable personal insights and growth over time.",
          "Your journal is a safe space for self-expression. There's no right or wrong way to journal - find what works best for you."
        ]
      };

      // Determine which category the question falls into
      let category = 'default';
      if (userQuestion.toLowerCase().includes('journal')) category = 'journal';
      if (userQuestion.toLowerCase().includes('mood')) category = 'mood';
      if (userQuestion.toLowerCase().includes('productiv')) category = 'productivity';

      // Get a random response from the appropriate category
      const categoryResponses = responses[category as keyof typeof responses];
      const randomIndex = Math.floor(Math.random() * categoryResponses.length);

      // Simulate AI processing time
      setTimeout(() => {
        setAiMessage(categoryResponses[randomIndex]);
        setIsAiLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Error with AI assistant:', err);
      setError('Failed to process your request. Please try again.');
      setIsAiLoading(false);
    }
  };

  const handleGetTip = async () => {
    try {
      setIsAiLoading(true);
      setError(null);

      const tips = [
        "💡 Tip: Try the 'Morning Pages' technique - write three pages of stream-of-consciousness thoughts each morning.",
        "✨ Insight: End each entry with one thing you're grateful for to boost positive emotions.",
        "🎯 Strategy: Use the STAR method (Situation, Task, Action, Result) to structure problem-solving entries.",
        "🌱 Growth: Review your entries weekly to identify patterns and areas for improvement.",
        "🧠 Technique: Try 'cognitive reframing' in your journal - rewrite negative situations from a more positive or neutral perspective.",
        "⏱️ Productivity: The '2-Minute Rule' can help with journaling consistency - if it takes less than 2 minutes, do it now.",
        "🔄 Reflection: Try the 'What? So What? Now What?' framework to deepen your reflections.",
        "📊 Progress: Track key metrics that matter to you (sleep, mood, energy) alongside your entries to spot correlations."
      ];

      // Simulate AI processing time
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * tips.length);
        setAiMessage(tips[randomIndex]);
        setIsAiLoading(false);
      }, 800);

    } catch (err) {
      console.error('Error getting AI tip:', err);
      setError('Failed to retrieve a tip. Please try again.');
      setIsAiLoading(false);
    }
  };

  // Add suggestion to entry
  const addSuggestionToEntry = (suggestion: string) => {
    setCurrentEntry(currentEntry ? currentEntry + '\n\n' + suggestion : suggestion);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
      : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
      }`}>
      {/* Hidden file input for attachments */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        title="Upload image attachment"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
        >
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
              }`}>
              Reflection Journal
            </h1>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Capture thoughts, track moods, and gain insights
            </p>
          </div>

          {/* Top-right actions */}
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              className={`flex items-center px-4 py-2 rounded-xl border transition-all ${darkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Filter
            </motion.button>

            {/* Export Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || entries.length === 0}
                className={`flex items-center px-4 py-2 rounded-xl transition-all ${darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500'
                  }`}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </motion.button>

              {/* Export Menu */}
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${darkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                      }`}
                  >
                    <button
                      onClick={() => {
                        handleExportPDF();
                        setShowExportMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                    >
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-3 text-red-500" />
                        <div>
                          <div className="font-medium">Export as PDF</div>
                          <div className="text-xs opacity-60">Formatted document</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleExportDOCX();
                        setShowExportMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                    >
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-3 text-blue-500" />
                        <div>
                          <div className="font-medium">Export as DOCX</div>
                          <div className="text-xs opacity-60">Editable document</div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Editor Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 ${darkMode
                ? 'bg-gray-800/50 border border-gray-700'
                : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
                }`}
            >
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                New Entry
              </h2>

              {/* Title input */}
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Entry title (optional)"
                className={`w-full mb-4 px-4 py-3 rounded-xl border transition-all ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
              />

              {/* Templates and Privacy Controls */}
              <div className="flex mb-4 gap-2">
                <button
                  onClick={() => setShowEntryTemplates(!showEntryTemplates)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${darkMode
                    ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                    }`}
                >
                  <FileText size={16} className="mr-2" />
                  Templates
                </button>

                <button
                  onClick={handleAttachment}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                >
                  <PlusCircle size={16} className="mr-2" />
                  Add Image
                </button>

                <button
                  onClick={() => setIsPrivateEntry(!isPrivateEntry)}
                  className={`flex items-center ml-auto px-3 py-2 rounded-lg text-sm ${isPrivateEntry
                    ? (darkMode ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700')
                    : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
                    }`}
                >
                  {isPrivateEntry ? 'Private 🔒' : 'Public 🌐'}
                </button>
              </div>

              {/* Template dropdown */}
              <AnimatePresence>
                {showEntryTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mb-4 overflow-hidden rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                  >
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entryTemplates.map((template, index) => (
                        <div
                          key={index}
                          onClick={() => applyTemplate(template.template)}
                          className={`cursor-pointer p-3 rounded-lg transition-all ${darkMode
                            ? 'bg-gray-600 hover:bg-gray-500 text-white'
                            : 'bg-white hover:bg-gray-100 text-gray-800'
                            }`}
                        >
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>{template.name}</h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>{template.description}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Image attachments */}
              {currentAttachments.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {currentAttachments.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt="Attachment"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => setCurrentAttachments(currentAttachments.filter((_, i) => i !== index))}
                        className={`absolute -top-2 -right-2 rounded-full p-1 ${darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                          }`}
                        title="Remove attachment"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Mood selector */}
              <div className="mb-4">
                <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  How are you feeling?
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(moodEmojis).map(([mood, emoji]) => (
                    <button
                      key={mood}
                      onClick={() => setCurrentMood(mood)}
                      className={`p-2 rounded-lg transition-all ${currentMood === mood
                        ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800')
                        : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
                        }`}
                    >
                      {emoji} <span className="ml-1 text-sm">{mood}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="mb-4">
                <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  Prompts & Suggestions
                </label>
                <div className="flex flex-wrap gap-2">
                  {autoSuggestions.slice(0, 5).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => addSuggestionToEntry(suggestion)}
                      className={`px-3 py-2 text-sm rounded-lg transition-all ${darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                    >
                      {suggestion.length > 25 ? suggestion.substring(0, 25) + '...' : suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simple writing tip */}
              <div className={`mb-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'
                }`}>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  💡 Write naturally - your thoughts will be beautifully formatted when displayed
                </p>
              </div>

              {/* Main text area */}
              <div className="mb-4">
                <textarea
                  value={currentEntry}
                  onChange={(e) => setCurrentEntry(e.target.value)}
                  placeholder="Write about your day, thoughts, or anything you'd like to reflect on..."
                  rows={8}
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none`}
                ></textarea>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={currentTags}
                  onChange={(e) => setCurrentTags(e.target.value)}
                  placeholder="work, ideas, goals..."
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                  {error}
                </div>
              )}

              {/* Button */}
              <button
                disabled={submitting || !currentEntry.trim() || uploadingFile}
                onClick={handleSaveEntry}
                className={`w-full py-3 rounded-xl flex items-center justify-center transition-all ${currentEntry.trim() && !submitting && !uploadingFile
                  ? (darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                  : (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                  }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Entry
                  </>
                )}
              </button>
            </motion.div>

            {/* AI Insights Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 ${darkMode
                ? 'bg-gray-800/50 border border-gray-700'
                : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  <Brain className="inline-block mr-2 text-purple-500" />
                  AI Insights
                </h2>

                <button
                  onClick={handleGenerateInsight}
                  disabled={isGeneratingAIInsights || entries.length === 0}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${darkMode
                    ? 'bg-purple-700 hover:bg-purple-600 text-white disabled:bg-gray-700 disabled:text-gray-400'
                    : 'bg-purple-500 hover:bg-purple-600 text-white disabled:bg-gray-300 disabled:text-gray-500'
                    }`}
                >
                  {isGeneratingAIInsights ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Insights
                    </>
                  )}
                </button>

                {/* Test button for debugging */}

              </div>

              {aiInsight ? (
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'
                  } border ${darkMode ? 'border-purple-900/30' : 'border-purple-100'
                  }`}>
                  <div className={`flex mb-2 ${darkMode ? 'text-purple-300' : 'text-purple-500'
                    }`}>
                    <Lightbulb className="w-5 h-5 mr-2 flex-shrink-0" />
                    <h3 className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-800'
                      }`}>Journal Insight</h3>
                  </div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {aiInsight}
                  </p>
                </div>
              ) : (
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  } border ${darkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                  <div className="flex justify-center items-center py-4">
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {entries.length === 0
                        ? "Start journaling to receive AI-powered insights about your entries."
                        : "Click 'Generate Insight' to get AI analysis of your journal entries."}
                    </p>
                  </div>
                </div>
              )}

              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                  Debug: showAIInsights={showAIInsights.toString()}, aiInsights.length={aiInsights.length}
                </div>
              )}

              {/* Comprehensive AI Insights */}
              <AnimatePresence>
                {showAIInsights && aiInsights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-800'
                        }`}>
                        Detailed Insights ({aiInsights.length})
                      </h3>
                      <button
                        onClick={() => setShowAIInsights(false)}
                        className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        title="Close insights"
                        aria-label="Close AI insights"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {aiInsights.map((insight, index) => (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-800/50 border-gray-700'
                            : 'bg-white/50 border-gray-200'
                            }`}
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`p-1 rounded-full ${insight.type === 'emotion' ? 'bg-pink-100 dark:bg-pink-900/30' :
                                insight.type === 'pattern' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                  insight.type === 'suggestion' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                    insight.type === 'growth' ? 'bg-green-100 dark:bg-green-900/30' :
                                      insight.type === 'concern' ? 'bg-red-100 dark:bg-red-900/30' :
                                        'bg-gray-100 dark:bg-gray-700'
                              }`}>
                              {insight.type === 'emotion' && <span className="text-pink-600 dark:text-pink-400">💭</span>}
                              {insight.type === 'pattern' && <span className="text-blue-600 dark:text-blue-400">🔍</span>}
                              {insight.type === 'suggestion' && <span className="text-yellow-600 dark:text-yellow-400">💡</span>}
                              {insight.type === 'growth' && <span className="text-green-600 dark:text-green-400">📈</span>}
                              {insight.type === 'concern' && <span className="text-red-600 dark:text-red-400">⚠️</span>}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>
                                  {insight.title}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${insight.confidence > 0.8 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  insight.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                  }`}>
                                  {Math.round(insight.confidence * 100)}%
                                </span>
                              </div>
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                {insight.description}
                              </p>
                              {insight.actionable && (
                                <div className={`mt-2 p-2 rounded text-xs ${darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                                  }`}>
                                  <strong>Action:</strong> {insight.actionable}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Filters Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 ${darkMode
                ? 'bg-gray-800/50 border border-gray-700'
                : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
                }`}
            >
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search entries, tags, or content..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-3">
                {/* Mood Filter */}
                <select
                  value={selectedMoodFilter}
                  onChange={(e) => setSelectedMoodFilter(e.target.value)}
                  title="Filter by mood"
                  className={`px-3 py-2 rounded-lg border text-sm ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="all">All Moods</option>
                  {Object.keys(moodEmojis).map(mood => (
                    <option key={mood} value={mood}>
                      {moodEmojis[mood as keyof typeof moodEmojis]} {mood}
                    </option>
                  ))}
                </select>

                {/* Tag Filter */}
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  title="Filter by tag"
                  className={`px-3 py-2 rounded-lg border text-sm ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag: string) => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(searchTerm || selectedMoodFilter !== 'all' || selectedTagFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedMoodFilter('all');
                      setSelectedTagFilter('all');
                    }}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>

            {/* Streak Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 ${darkMode
                ? 'bg-gray-800/50 border border-gray-700'
                : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  Journal Streak
                </h2>

                <div className={`flex items-center px-3 py-1 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                  <span className="text-sm font-medium">{streak.current} day{streak.current !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Current Streak</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{streak.current} day{streak.current !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Longest Streak</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{streak.longest} day{streak.longest !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Write daily to build your streak and develop a consistent journaling habit!
              </p>
            </motion.div>

            {/* Journal Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className={`rounded-2xl p-6 ${darkMode
                ? 'bg-gray-800/50 border border-gray-700'
                : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Lightbulb className="inline-block mr-2" size={20} />
                  Session Insights
                </h2>
                <button
                  onClick={() => setShowInsightsModal(true)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${darkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                >
                  <BookOpen size={16} className="mr-2" />
                  View All
                </button>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                Key takeaways and patterns are automatically saved from your entries.
              </p>
            </motion.div>

            {/* Past Entries */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 ${darkMode
                ? 'bg-gray-800/50 border border-gray-700'
                : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
                }`}
            >
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                Past Entries
              </h2>

              {loading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {filteredEntries.map(entry => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-xl ${darkMode
                          ? 'bg-gray-700 hover:bg-gray-650'
                          : 'bg-white hover:bg-gray-50'
                          } border ${darkMode ? 'border-gray-600' : 'border-gray-200'
                          } transition-all`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {entry.title}
                          </h3>
                          <div className="flex items-center">
                            <span className="mr-2">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</span>
                            <button
                              onClick={() => entry.id && handleDeleteEntry(entry.id)}
                              className={`p-1 rounded-lg text-sm transition-all ${darkMode
                                ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                : 'hover:bg-red-100 text-red-500'
                                }`}
                              title="Delete entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className={`mb-4 leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                          {entry.content}
                        </div>

                        {/* Attachments */}
                        {entry.attachments && entry.attachments.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {entry.attachments.map((url, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={url}
                                alt="Attachment"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {entry.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className={`text-xs px-2 py-1 rounded-full ${darkMode
                                  ? 'bg-gray-600 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Sentiment Analysis */}
                        {entry.sentiment && entry.sentiment.analysis && (
                          <div className={`text-xs pt-2 border-t ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
                            }`}>
                            <div className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${entry.sentiment.score > 0.2
                                ? 'bg-green-500'
                                : entry.sentiment.score < -0.2
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                                }`}></span>
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {entry.sentiment.analysis}
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredEntries.length === 0 && (
                    <div className={`p-6 rounded-xl text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                      <p className={`mb-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        No entries found
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {entries.length === 0
                          ? "Start journaling to see your entries here!"
                          : "Try adjusting your filters to see more entries."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Journal Insights Modal */}
      <JournalInsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
      />

      {/* Floating AI Assistant */}
      <FloatingAssistant
        isAiLoading={isAiLoading}
        aiMessage={aiMessage}
        aiChatInput={aiChatInput}
        setAiChatInput={setAiChatInput}
        onAskAI={handleAskAI}
        onGetTip={handleGetTip}
      />
    </div>
  );
};

export default Journal;
