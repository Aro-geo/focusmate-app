import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, BarChart3, Zap, MessageCircle, Send, Loader } from 'lucide-react';
import { useDeepSeek } from '../hooks/useDeepSeek';
import SecureDeepSeekService from '../services/SecureDeepSeekService';

interface DemoResponse {
  content: string;
  model: string;
  temperature: number;
  useCase: string;
}

const DeepSeekDualDemo: React.FC = () => {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<DemoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { generateStreamResponse } = useDeepSeek();

  const demos = [
    {
      title: 'Creative Assistant',
      description: 'deepseek-chat (Temperature 1.3)',
      icon: <MessageCircle className="w-5 h-5" />,
      model: 'chat',
      useCase: 'creative',
      prompt: 'Give me 3 creative ways to boost my productivity today',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Analytical Expert',
      description: 'deepseek-reasoner (Temperature 1.0)',
      icon: <BarChart3 className="w-5 h-5" />,
      model: 'analysis',
      useCase: 'analysis',
      prompt: 'Analyze the productivity benefits of the Pomodoro technique',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  const handleDemo = async (demo: typeof demos[0]) => {
    setIsLoading(true);
    setResponses([]);
    
    try {
      // Test both models simultaneously
      const chatPromise = demo.model === 'chat' 
        ? generateStreamResponse(demo.prompt, 'chat')
        : SecureDeepSeekService.chat(demo.prompt, undefined, 'conversation');
        
      const analysisPromise = demo.model === 'analysis'
        ? generateStreamResponse(demo.prompt, 'analysis') 
        : SecureDeepSeekService.chat(demo.prompt, undefined, 'analysis');

      const [chatResult, analysisResult] = await Promise.all([chatPromise, analysisPromise]);

      const newResponses: DemoResponse[] = [];
      
      if (typeof chatResult === 'string') {
        newResponses.push({
          content: chatResult,
          model: 'deepseek-chat',
          temperature: 1.3,
          useCase: 'creative'
        });
      }
      
      if (typeof analysisResult === 'object' && 'response' in analysisResult) {
        newResponses.push({
          content: analysisResult.response,
          model: 'deepseek-reasoner', 
          temperature: 1.0,
          useCase: 'analytical'
        });
      }

      setResponses(newResponses);
    } catch (error) {
      console.error('Demo error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setResponses([]);

    try {
      // Test both models with the same prompt
      const [chatResponse, analysisResponse] = await Promise.all([
        SecureDeepSeekService.chat(input, undefined, 'conversation'),
        SecureDeepSeekService.chat(input, undefined, 'analysis')
      ]);

      setResponses([
        {
          content: chatResponse.response,
          model: 'deepseek-chat',
          temperature: 1.3,
          useCase: 'creative'
        },
        {
          content: analysisResponse.response,
          model: 'deepseek-reasoner',
          temperature: 1.0,
          useCase: 'analytical'
        }
      ]);
    } catch (error) {
      console.error('Custom prompt error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Brain className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold">DeepSeek AI Integration</h2>
        </div>
        <p className="text-gray-600">
          Dual-role AI system with specialized models for different tasks
        </p>
      </div>

      {/* Demo Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {demos.map((demo, index) => (
          <motion.div
            key={index}
            className="p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => handleDemo(demo)}
          >
            <div className={`w-full h-2 rounded-full bg-gradient-to-r ${demo.color} mb-4`} />
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${demo.color} text-white`}>
                {demo.icon}
              </div>
              <div>
                <h3 className="font-semibold">{demo.title}</h3>
                <p className="text-sm text-gray-600">{demo.description}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 italic">"{demo.prompt}"</p>
          </motion.div>
        ))}
      </div>

      {/* Custom Input */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>Test Both Models</span>
        </h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your prompt to compare both models..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleCustomPrompt()}
          />
          <button
            onClick={handleCustomPrompt}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Test</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {responses.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">AI Responses Comparison</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {responses.map((response, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {response.model === 'deepseek-chat' ? (
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                    ) : (
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="font-medium text-sm">{response.model}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    T: {response.temperature} • {response.useCase}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{response.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center space-x-2 py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Running AI models...</span>
        </div>
      )}

      {/* Model Specifications */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Model Specifications</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-600 mb-2">deepseek-chat (Creative)</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Temperature: 1.3 (High creativity)</li>
              <li>• Use cases: Conversation, creative writing, motivation</li>
              <li>• Max tokens: 300</li>
              <li>• Streaming: ✅ Enabled</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-600 mb-2">deepseek-reasoner (Analytical)</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Temperature: 1.0 (Balanced analysis)</li>
              <li>• Use cases: Data analysis, logical reasoning, coding</li>
              <li>• Max tokens: 500</li>
              <li>• Streaming: ✅ Enabled</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepSeekDualDemo;