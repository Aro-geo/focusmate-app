import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { 
  Brain, 
  MessageCircle, 
  Lightbulb, 
  Minimize2,
  Loader,
  Send,
  BookmarkPlus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import FormattedMessage from './FormattedMessage';
import { aiFocusTipsService } from '../services/AIFocusTipsService';

interface FloatingAssistantProps {
  isAiLoading: boolean;
  aiMessage: string;
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  onAskAI: () => void;
  onGetTip: () => void;
  sessionId?: string;
}

const FloatingAssistant: React.FC<FloatingAssistantProps> = memo(({
  isAiLoading,
  aiMessage,
  aiChatInput,
  setAiChatInput,
  onAskAI,
  onGetTip,
  sessionId
}) => {
  const { darkMode } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right corner
  useEffect(() => {
    const updatePosition = () => {
      const margin = window.innerWidth < 768 ? 10 : 20;
      const assistantWidth = isMinimized ? (window.innerWidth < 768 ? 50 : 60) : (window.innerWidth < 768 ? 280 : 320);
      const assistantHeight = isMinimized ? (window.innerWidth < 768 ? 50 : 60) : (showChat ? (window.innerWidth < 768 ? 350 : 400) : (window.innerWidth < 768 ? 240 : 280));
      const newPos = {
        x: Math.max(0, window.innerWidth - assistantWidth - margin),
        y: Math.max(0, window.innerHeight - assistantHeight - margin - (window.innerWidth < 768 ? 80 : 0))
      };
      setPosition(newPos);

    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isMinimized, showChat]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // Keep within viewport bounds
    const margin = window.innerWidth < 768 ? 5 : 10;
    const assistantWidth = isMinimized ? (window.innerWidth < 768 ? 50 : 60) : (window.innerWidth < 768 ? 280 : 320);
    const assistantHeight = isMinimized ? (window.innerWidth < 768 ? 50 : 60) : (showChat ? (window.innerWidth < 768 ? 350 : 400) : (window.innerWidth < 768 ? 240 : 280));
    const newX = Math.max(margin, Math.min(window.innerWidth - assistantWidth - margin, position.x + info.offset.x));
    const newY = Math.max(margin, Math.min(window.innerHeight - assistantHeight - margin - (window.innerWidth < 768 ? 80 : 0), position.y + info.offset.y));
    setPosition({ x: newX, y: newY });

  };

  const handleSendMessage = useCallback(() => {
    if (aiChatInput.trim() && !isAiLoading) {
      onAskAI();
    }
  }, [aiChatInput, isAiLoading, onAskAI]);

  const handleSaveTip = useCallback(async () => {
    try {
      const tipData = aiFocusTipsService.extractTipFromAIMessage(aiMessage);
      if (tipData) {
        await aiFocusTipsService.saveTip({
          ...tipData,
          source: 'ai-coach',
          sessionId
        });
      }
    } catch (error) {
      console.error('Error saving tip:', error);
    }
  }, [aiMessage, sessionId]);

  if (isMinimized) {
    return (
      <motion.div
        ref={containerRef}
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{ 
          x: position.x, 
          y: position.y,
          scale: isDragging ? 1.05 : 1
        }}
        whileHover={{ scale: 1.1 }}
        className="fixed z-[9999] cursor-grab active:cursor-grabbing floating-assistant-size"
        initial={{ opacity: 0, scale: 0 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.button
          onClick={() => setIsMinimized(false)}
          className={`w-full h-full rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white shadow-gray-900/50' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Brain className={`${window.innerWidth < 768 ? 'w-5 h-5' : 'w-6 h-6'}`} />
          {isAiLoading && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      animate={{ 
        x: position.x, 
        y: position.y,
        scale: isDragging ? 1.02 : 1
      }}
      className={`fixed z-[9999] cursor-grab active:cursor-grabbing ${showChat ? 'floating-assistant-expanded-chat' : 'floating-assistant-expanded'}`}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className={`w-full h-full rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
        darkMode 
          ? 'bg-gray-800 border border-gray-700 shadow-black/50' 
          : 'bg-white border border-gray-200 shadow-xl'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b cursor-grab active:cursor-grabbing ${
          darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={isAiLoading ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isAiLoading ? Infinity : 0, ease: "linear" }}
              >
                <Brain className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`} />
              </motion.div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                AI Assistant
              </h3>
              {isAiLoading && (
                <Loader className={`w-4 h-4 animate-spin ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`} />
              )}
            </div>
            <div className="flex items-center space-x-1">
              <motion.button
                onClick={() => setIsMinimized(true)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minimize2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          {/* AI Message */}
          <div className={`flex-1 mb-4 p-3 rounded-lg ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            {isAiLoading ? (
              <motion.div
                className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={aiMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FormattedMessage
                  message={aiMessage || "## Hello! 👋\n\nI'm here to help you stay focused and productive. Ask me anything or get a quick tip!"}
                  className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                />
              </motion.div>
            )}
          </div>

          {/* Chat Input */}
          {showChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition-all mobile-input ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isAiLoading}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isAiLoading || !aiChatInput.trim()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <motion.button 
              onClick={() => setShowChat(!showChat)}
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                showChat 
                  ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                  : (darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAiLoading}
            >
              <MessageCircle className="w-4 h-4" />
            </motion.button>
            <motion.button 
              onClick={onGetTip}
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAiLoading}
            >
              <Lightbulb className="w-4 h-4" />
            </motion.button>
            <motion.button 
              onClick={handleSaveTip}
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                darkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAiLoading || !aiMessage.includes('##')}
            >
              <BookmarkPlus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

FloatingAssistant.displayName = 'FloatingAssistant';

export default FloatingAssistant;
