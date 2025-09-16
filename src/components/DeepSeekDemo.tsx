import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageCircle, BarChart3, Loader, Send } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useDeepSeek } from '../hooks/useDeepSeek';

const DeepSeekDemo: React.FC = () => {
  const { darkMode } = useTheme();
  const { isLoading, generateStreamResponse, streamContent, clearStream } = useDeepSeek();
  const [activeRole, setActiveRole] = useState<'chat' | 'analysis'>('chat');
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    setIsStreaming(true);
    clearStream();
    setResponse('');

    try {
      let fullResponse = '';
      await generateStreamResponse(
        input,
        activeRole,
        (chunk) => {
          fullResponse += chunk;
          setResponse(fullResponse);
        }
      );
    } catch (error) {
      console.error('Demo error:', error);
      setResponse('Error generating response. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  const examplePrompts = {
    chat: [
      "Give me a creative productivity tip",
      "How can I make my workspace more inspiring?",
      "What's a fun way to celebrate completing tasks?"
    ],
    analysis: [
      "Analyze my productivity pattern: 3 tasks completed, 2 Pomodoro sessions, feeling tired",
      "What insights can you provide about working 6 hours with 3 breaks?",
      "Compare morning vs afternoon productivity based on task completion rates"
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-4xl mx-auto p-6 rounded-xl shadow-lg ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          DeepSeek AI Integration Demo
        </h2>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Experience two specialized AI roles with real-time streaming
        </p>
      </div>

      {/* Role Selector */}
      <div className="flex justify-center mb-6">
        <div className={`flex rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <button
            onClick={() => setActiveRole('chat')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeRole === 'chat'
                ? (darkMode ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white')
                : (darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800')
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Creative Chat</span>
            <span className="text-xs opacity-75">(temp: 1.3)</span>
          </button>
          <button
            onClick={() => setActiveRole('analysis')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeRole === 'analysis'
                ? (darkMode ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white')
                : (darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800')
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Data Analysis</span>
            <span className="text-xs opacity-75">(temp: 1.0)</span>
          </button>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="mb-4">
        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Try these examples:
        </p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts[activeRole].map((prompt, index) => (
            <button
              key={index}
              onClick={() => setInput(prompt)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:border-purple-500 hover:text-purple-400'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-500 hover:text-indigo-600'
              }`}
            >
              {prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex space-x-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask the ${activeRole === 'chat' ? 'creative assistant' : 'data analyst'}...`}
          className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500'
          }`}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={isLoading || isStreaming}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || isStreaming || !input.trim()}
          className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
            darkMode
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isLoading || isStreaming ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Response */}
      <div className={`min-h-[200px] p-4 rounded-lg border ${
        darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <Brain className={`w-4 h-4 ${
            activeRole === 'chat' 
              ? (darkMode ? 'text-purple-400' : 'text-indigo-600')
              : (darkMode ? 'text-green-400' : 'text-green-600')
          }`} />
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {activeRole === 'chat' ? 'Creative Assistant' : 'Data Analyst'} Response:
          </span>
          {isStreaming && (
            <Loader className="w-3 h-3 animate-spin" />
          )}
        </div>
        
        <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {response || (isStreaming ? 'Generating response...' : 'Response will appear here')}
          {isStreaming && (
            <motion.div
              className="inline-block w-2 h-4 bg-current ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* Features Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
          <h4 className={`font-semibold mb-2 ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`}>
            Creative Chat (deepseek-chat)
          </h4>
          <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <li>• High creativity (temperature: 1.3)</li>
            <li>• Engaging, motivational responses</li>
            <li>• Creative suggestions and ideas</li>
            <li>• Real-time streaming</li>
          </ul>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
          <h4 className={`font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            Data Analysis (deepseek-reasoner)
          </h4>
          <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <li>• Balanced analysis (temperature: 1.0)</li>
            <li>• Data-driven insights</li>
            <li>• Logical recommendations</li>
            <li>• Real-time streaming</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default DeepSeekDemo;