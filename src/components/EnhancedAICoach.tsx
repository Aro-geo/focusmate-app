import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Brain, 
  Send, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Award,
  Minimize2,
  Maximize2,
  Loader,
  User,
  Bot
} from 'lucide-react';
import { enhancedAIFocusCoachService, ConversationContext, AIResponse } from '../services/EnhancedAIFocusCoachService';
import { useAuth } from '../context/AuthContext';

interface EnhancedAICoachProps {
  isActive: boolean;
  isPaused: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  timeRemaining: number;
  cycles: number;
  todayPomodoros: number;
  distractions: string[];
  currentTask?: string;
  onAddDistraction?: (distraction: string) => void;
  onAdjustTimer?: (newDuration: number) => void;
  onStartSession?: () => void;
  className?: string;
  darkMode?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: string;
  suggestions?: string[];
  followUpQuestions?: string[];
}

const EnhancedAICoach: React.FC<EnhancedAICoachProps> = ({
  isActive,
  isPaused,
  mode,
  duration,
  timeRemaining,
  cycles,
  todayPomodoros,
  distractions,
  currentTask,
  onAddDistraction,
  onAdjustTimer,
  onStartSession,
  className = '',
  darkMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize AI coach when component mounts
  useEffect(() => {
    if (user) {
      enhancedAIFocusCoachService.loadUserProfile(user.id);
      
      // Send initial greeting
      handleAIInteraction('start');
    }
  }, [user]);

  // Handle session state changes
  useEffect(() => {
    if (isActive && !isPaused) {
      // Session started
      if (chatMessages.length === 0 || chatMessages[chatMessages.length - 1].context !== 'session-start') {
        handleAIInteraction('session-start');
      }
    } else if (isPaused) {
      // Session paused
      handleAIInteraction('pause');
    }
  }, [isActive, isPaused]);

  // Handle session completion
  useEffect(() => {
    if (timeRemaining === 0 && isActive) {
      handleAIInteraction('completion');
    }
  }, [timeRemaining, isActive]);

  const handleAIInteraction = async (
    contextType: 'start' | 'session-start' | 'pause' | 'completion' | 'break' | 'distraction' | 'reflection',
    userMessage?: string
  ) => {
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentStreamingMessage('');

    try {
      const context: ConversationContext = {
        sessionType: contextType === 'session-start' ? 'start' : contextType,
        currentTask,
        timeElapsed: duration * 60 - timeRemaining,
        totalDuration: duration * 60,
        distractionCount: distractions.length,
        streakCount: cycles,
        timeOfDay: getTimeOfDay(),
        recentPerformance: {
          completionRate: todayPomodoros > 0 ? 0.8 : 0, // Mock data - would be calculated from history
          averageDistractions: distractions.length,
          preferredTimes: [getTimeOfDay()]
        }
      };

      // Add user message if provided
      if (userMessage) {
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: userMessage,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, userMsg]);
      }

      // Create placeholder AI message for streaming
      const aiMessageId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        context: contextType,
        suggestions: [],
        followUpQuestions: []
      };
      setChatMessages(prev => [...prev, aiMsg]);

      // Stream the response
      let fullContent = '';
      const streamGenerator = enhancedAIFocusCoachService.generateStreamResponse(context, userMessage);

      for await (const chunk of streamGenerator) {
        if (chunk.isComplete) {
          // Update final message with parsed response
          if (chunk.fullResponse) {
            setChatMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? {
                    ...msg,
                    content: chunk.fullResponse!.message,
                    suggestions: chunk.fullResponse!.suggestions,
                    followUpQuestions: chunk.fullResponse!.followUpQuestions
                  }
                : msg
            ));
          }
          setCurrentStreamingMessage('');
          break;
        } else {
          // Update streaming content
          fullContent += chunk.chunk;
          setCurrentStreamingMessage(fullContent);
          setChatMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ));
        }
      }

    } catch (error) {
      console.error('Error in AI interaction:', error);
      
      // Fallback message
      const fallbackMsg: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        type: 'ai',
        content: getFallbackMessage(contextType),
        timestamp: new Date(),
        context: contextType
      };
      
      setChatMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');

    await handleAIInteraction('reflection', message);
  };

  const handleQuickResponse = async (response: string) => {
    await handleAIInteraction('reflection', response);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getFallbackMessage = (contextType: string): string => {
    const messages = {
      start: "Hello! I'm your AI Focus Coach. I'm here to help you maximize your productivity and understand your focus patterns. How are you feeling about today's work?",
      'session-start': "Great! Let's make this session count. What's your main objective for the next 25 minutes?",
      pause: "Taking a pause is perfectly fine. What's on your mind right now?",
      completion: "Excellent work! How do you feel about what you accomplished in that session?",
      break: "Time for a well-deserved break! How was your focus during that session?",
      distraction: "I noticed something pulled your attention. What was it that distracted you?",
      reflection: "I'm here to help you reflect on your focus journey. What would you like to discuss?"
    };
    
    return messages[contextType as keyof typeof messages] || "How can I help you stay focused today?";
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isExpanded) {
    return (
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className={`relative p-4 rounded-full shadow-lg ${
            darkMode 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          } transition-colors duration-200`}
          aria-label="Open AI Focus Coach"
        >
          <Brain className="h-6 w-6" />
          {isLoading && (
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          )}
          {chatMessages.length > 0 && !isLoading && (
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            </div>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`fixed bottom-6 right-6 w-96 h-[500px] z-50 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      } rounded-lg shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold">AI Focus Coach</h3>
          {isLoading && <Loader className="h-4 w-4 animate-spin text-indigo-500" />}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Toggle insights"
          >
            <TrendingUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Minimize coach"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Insights Panel */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`p-3 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <span>Today: {todayPomodoros} sessions completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span>Current streak: {cycles} cycles</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                <span>Distractions: {distractions.length} this session</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-center space-x-2 mb-1 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                {message.type === 'ai' && <Bot className="h-4 w-4 text-indigo-500" />}
                <span className="text-xs opacity-60">{formatTime(message.timestamp)}</span>
                {message.type === 'user' && <User className="h-4 w-4 text-gray-500" />}
              </div>
              
              <div className={`p-3 rounded-lg ${
                message.type === 'user'
                  ? darkMode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-indigo-500 text-white'
                  : darkMode 
                    ? 'bg-gray-700 text-gray-100' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">
                  {message.content}
                  {isStreaming && message.type === 'ai' && message.id === chatMessages[chatMessages.length - 1]?.id && (
                    <motion.span
                      className="inline-block w-2 h-4 bg-current ml-1"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                </p>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-xs opacity-80 flex items-start space-x-1">
                        <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Follow-up Questions */}
                {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.followUpQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickResponse(question)}
                        className={`block w-full text-left text-xs p-2 rounded ${
                          darkMode 
                            ? 'bg-gray-600 hover:bg-gray-500' 
                            : 'bg-white hover:bg-gray-50'
                        } transition-colors duration-150`}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {(isLoading || isStreaming) && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                <Loader className="h-4 w-4 animate-spin text-indigo-500" />
                <span className="text-sm opacity-60">
                  {isStreaming ? 'AI is responding...' : 'AI is thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts or ask for help..."
            className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            disabled={isLoading || isStreaming}
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading || isStreaming}
            className={`p-2 rounded-lg ${
              !userInput.trim() || isLoading || isStreaming
                ? darkMode 
                  ? 'bg-gray-700 text-gray-500' 
                  : 'bg-gray-200 text-gray-400'
                : darkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            } transition-colors duration-150`}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => handleQuickResponse("I'm feeling distracted")}
            className={`text-xs px-2 py-1 rounded ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            } transition-colors duration-150`}
          >
            I'm distracted
          </button>
          <button
            onClick={() => handleQuickResponse("How can I improve my focus?")}
            className={`text-xs px-2 py-1 rounded ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            } transition-colors duration-150`}
          >
            Need focus tips
          </button>
          <button
            onClick={() => handleQuickResponse("I completed my task!")}
            className={`text-xs px-2 py-1 rounded ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            } transition-colors duration-150`}
          >
            Task completed!
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedAICoach;