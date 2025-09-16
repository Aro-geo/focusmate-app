import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, MessageSquare, Brain } from 'lucide-react';
import { aiFocusCoachService, FocusInsight } from '../services/AIFocusCoachService';
import { useAuth } from '../context/AuthContext';

interface AICoachProps {
  isActive: boolean;
  isPaused: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  cycles: number;
  todayPomodoros: number;
  distractions: string[];
  onAddDistraction: (distraction: string) => void;
  onAdjustTimer?: (newDuration: number) => void;
  onStartSession?: () => void;
  className?: string;
  darkMode?: boolean;
}

const AICoach: React.FC<AICoachProps> = ({
  isActive,
  isPaused,
  mode,
  duration,
  cycles,
  todayPomodoros,
  distractions,
  onAddDistraction,
  onAdjustTimer,
  onStartSession,
  className = '',
  darkMode = false
}) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<FocusInsight[]>([]);
  const [showInsights, setShowInsights] = useState(true);
  const [showCoach, setShowCoach] = useState(false);
  const [newDistraction, setNewDistraction] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreamingInsight, setIsStreamingInsight] = useState(false);
  const [streamingInsightContent, setStreamingInsightContent] = useState('');
  
  // Initialize coach with user data
  useEffect(() => {
    if (user) {
      aiFocusCoachService.loadUserData(user.id);
    }
  }, [user]);
  
  // Generate insights based on current state
  useEffect(() => {
    if (!user) return;
    
    const generateInsights = async () => {
      const newInsights: FocusInsight[] = [];
      
      // Get time of day
      const hour = new Date().getHours();
      let timeOfDay = 'morning';
      if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      if (hour >= 17) timeOfDay = 'evening';
      
      // Add session suggestion
      const sessionSuggestion = aiFocusCoachService.getSessionSuggestion(timeOfDay, duration);
      if (sessionSuggestion) newInsights.push(sessionSuggestion);
      
      // Add distraction insight if available
      if (distractions.length > 0) {
        const distractionInsight = aiFocusCoachService.getDistractionsInsight();
        if (distractionInsight) newInsights.push(distractionInsight);
      }
      
      // Add motivational challenge
      const challenge = aiFocusCoachService.getMotivationalChallenge(todayPomodoros, aiFocusCoachService.getAnalytics().streak);
      if (challenge) newInsights.push(challenge);
      
      // Add achievement if applicable
      const achievement = aiFocusCoachService.getAchievementInsight(todayPomodoros);
      if (achievement) newInsights.push(achievement);
      
      // Update insights
      setInsights(newInsights);
    };
    
    generateInsights();
  }, [user, mode, duration, cycles, todayPomodoros, distractions]);
  
  // Generate coach messages based on session state with streaming support
  useEffect(() => {
    const generateStreamingCoachMessage = async (messageType: string) => {
      if (Math.random() < 0.7) { // 70% chance for streaming, 30% for static
        setIsStreamingInsight(true);
        setStreamingInsightContent('');
        setCoachMessage('');
        
        try {
          const streamGenerator = aiFocusCoachService.generateStreamingInsight({
            messageType,
            sessionData: {
              isActive,
              isPaused,
              mode,
              duration,
              todayPomodoros,
              distractions: distractions.length
            },
            currentTime: new Date().toLocaleTimeString()
          });

          let fullContent = '';
          for await (const chunk of streamGenerator) {
            if (chunk.isComplete) {
              setCoachMessage(chunk.fullResponse || fullContent);
              setStreamingInsightContent('');
              break;
            } else {
              fullContent += chunk.chunk;
              setStreamingInsightContent(fullContent);
            }
          }
        } catch (error) {
          console.error('Streaming coach message error:', error);
          setCoachMessage(aiFocusCoachService.generateCoachMessage(messageType));
        } finally {
          setIsStreamingInsight(false);
        }
      } else {
        // Use static message
        setCoachMessage(aiFocusCoachService.generateCoachMessage(messageType));
      }
    };

    if (!isActive && !isPaused) {
      generateStreamingCoachMessage('session-start');
    } else if (mode !== 'work') {
      generateStreamingCoachMessage('break-start');
    } else if (isPaused) {
      generateStreamingCoachMessage('distraction');
    } else if (isActive) {
      // Randomly show encouragement during session
      if (Math.random() < 0.3) { // 30% chance
        setIsTyping(true);
        generateStreamingCoachMessage('encouragement');
        
        // Simulate typing effect
        setTimeout(() => {
          setIsTyping(false);
        }, 1500);
      }
    }
  }, [isActive, isPaused, mode, duration, todayPomodoros, distractions.length]);
  
  const handleInsightAction = (insight: FocusInsight) => {
    switch (insight.id) {
      case 'session-length':
        if (onAdjustTimer && insight.metrics?.Optimal) {
          const optimalMinutes = parseInt(insight.metrics.Optimal.toString());
          if (!isNaN(optimalMinutes)) onAdjustTimer(optimalMinutes);
        }
        break;
      case 'first-session':
      case 'four-pomodoro':
      case 'streak-keeper':
        if (onStartSession) onStartSession();
        break;
      default:
        // Just close the insight
        setInsights(prev => prev.filter(i => i.id !== insight.id));
        break;
    }
  };
  
  const handleAddDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDistraction.trim()) {
      onAddDistraction(newDistraction.trim());
      aiFocusCoachService.trackDistraction(newDistraction.trim());
      setNewDistraction('');
    }
  };

  const handleStreamingCoachingAdvice = async (query: string) => {
    setIsStreamingInsight(true);
    setStreamingInsightContent('');
    setCoachMessage('');
    
    try {
      const streamGenerator = aiFocusCoachService.streamCoachingAdvice(query);
      
      let fullContent = '';
      for await (const chunk of streamGenerator) {
        if (chunk.isComplete) {
          setCoachMessage(chunk.fullResponse || fullContent);
          setStreamingInsightContent('');
          break;
        } else {
          fullContent += chunk.chunk;
          setStreamingInsightContent(fullContent);
        }
      }
    } catch (error) {
      console.error('Streaming coaching advice error:', error);
      setCoachMessage('I apologize, but I\'m having trouble providing personalized advice right now. Try taking a short break and refocusing on your current task.');
    } finally {
      setIsStreamingInsight(false);
    }
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      {/* AI Coach Panel */}
      <div className={`rounded-xl overflow-hidden mb-4 ${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} shadow-lg`}>
        <div className={`px-4 py-3 flex justify-between items-center ${darkMode ? 'bg-indigo-900' : 'bg-indigo-600'}`}>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-white" />
            <h3 className="font-semibold text-white">AI Focus Coach</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowInsights(!showInsights)}
              className={`text-white/80 hover:text-white ${showInsights ? 'bg-indigo-700/50' : ''} p-1 rounded`}
              aria-label={showInsights ? "Hide insights" : "Show insights"}
              title={showInsights ? "Hide insights" : "Show insights"}
            >
              <Zap className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setShowCoach(!showCoach)}
              className={`text-white/80 hover:text-white ${showCoach ? 'bg-indigo-700/50' : ''} p-1 rounded`}
              aria-label={showCoach ? "Hide coach" : "Show coach"}
              title={showCoach ? "Hide coach" : "Show coach"}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Insights Section */}
        <AnimatePresence>
          {showInsights && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Focus Insights & Recommendations
                </h4>
                
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <motion.div
                        key={insight.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`p-3 rounded-lg border ${
                          insight.type === 'pattern' ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/50' : 
                          insight.type === 'suggestion' ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700/50' : 
                          insight.type === 'challenge' ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700/50' : 
                          'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-700/50'
                        }`}
                      >
                        <div className="flex justify-between">
                          <h5 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {insight.title}
                          </h5>
                          <button 
                            onClick={() => setInsights(prev => prev.filter(i => i.id !== insight.id))}
                            className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-200`}
                            aria-label="Dismiss insight"
                            title="Dismiss insight"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {insight.description}
                        </p>
                        
                        {insight.metrics && Object.keys(insight.metrics).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(insight.metrics).map(([key, value]) => (
                              <span 
                                key={key}
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {insight.actionText && (
                          <button
                            onClick={() => handleInsightAction(insight)}
                            className="w-full mt-2 text-xs flex justify-center items-center py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {insight.actionText}
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No insights available. Complete a session to generate personalized recommendations.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Coach Chat Section */}
        <AnimatePresence>
          {showCoach && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="p-4">
                <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                  <div className="flex items-start space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-700' : 'bg-indigo-200'}`}>
                      <Brain className={`w-4 h-4 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {isStreamingInsight ? streamingInsightContent : coachMessage}
                        {(isTyping || isStreamingInsight) && (
                          <span className="inline-flex ml-1">
                            <span className="animate-ping">.</span>
                            <span className="animate-ping delay-100">.</span>
                            <span className="animate-ping delay-200">.</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Distraction Input */}
                {isPaused && (
                  <form onSubmit={handleAddDistraction} className="mt-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newDistraction}
                        onChange={(e) => setNewDistraction(e.target.value)}
                        placeholder="What distracted you?"
                        className={`flex-1 px-3 py-2 text-sm rounded-md ${
                          darkMode 
                            ? 'bg-gray-700 text-white border-gray-600 focus:border-indigo-500' 
                            : 'bg-white text-gray-800 border-gray-300 focus:border-indigo-500'
                        } border focus:ring-0 outline-none`}
                      />
                      <button
                        type="submit"
                        disabled={!newDistraction.trim()}
                        className={`px-3 py-2 rounded-md bg-indigo-600 text-white ${
                          !newDistraction.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                        }`}
                      >
                        Log
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Quick Responses with Streaming AI */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleStreamingCoachingAdvice("I'm feeling distracted and need help focusing")}
                    className={`text-xs px-3 py-1 rounded-full ${
                      darkMode 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    disabled={isStreamingInsight}
                  >
                    🧠 Focus Help
                  </button>
                  <button 
                    onClick={() => handleStreamingCoachingAdvice("What's the best way to improve my productivity today?")}
                    className={`text-xs px-3 py-1 rounded-full ${
                      darkMode 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    disabled={isStreamingInsight}
                  >
                    💡 Productivity Tips
                  </button>
                  <button 
                    onClick={() => handleStreamingCoachingAdvice("How can I maintain my motivation throughout the day?")}
                    className={`text-xs px-3 py-1 rounded-full ${
                      darkMode 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    disabled={isStreamingInsight}
                  >
                    🚀 Motivation
                  </button>
                  <button 
                    onClick={() => onAddDistraction('Feeling distracted')}
                    className={`text-xs px-3 py-1 rounded-full ${
                      darkMode 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Feeling distracted
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AICoach;
