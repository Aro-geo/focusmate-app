import { useState, useCallback } from 'react';
import SecureDeepSeekService from '../services/SecureDeepSeekService';

export const useDeepSeek = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState('');

  const generateResponse = useCallback(async (prompt: string, role: 'chat' | 'analysis' = 'chat') => {
    setIsLoading(true);
    try {
      const useCase = role === 'chat' ? 'conversation' : 'analysis';
      const response = await SecureDeepSeekService.chat(prompt, undefined, useCase);
      return response.response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateStreamResponse = useCallback(async (
    prompt: string, 
    role: 'chat' | 'analysis' = 'chat',
    onChunk?: (chunk: string) => void
  ) => {
    setIsLoading(true);
    setStreamContent('');
    
    try {
      const useCase = role === 'chat' ? 'conversation' : 'analysis';
      const stream = SecureDeepSeekService.chatStream(prompt, undefined, useCase);

      let fullContent = '';
      
      for await (const chunk of stream) {
        if (chunk.error) {
          console.error('Streaming error:', chunk.error);
          break;
        }
        
        if (chunk.content) {
          fullContent += chunk.content;
          setStreamContent(fullContent);
          onChunk?.(chunk.content);
        }
        
        if (chunk.done) {
          break;
        }
      }
      
      return fullContent;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearStream = useCallback(() => {
    setStreamContent('');
  }, []);

  return {
    isLoading,
    streamContent,
    generateResponse,
    generateStreamResponse,
    clearStream
  };
};