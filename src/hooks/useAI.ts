import { useState, useCallback } from 'react';
import SecureDeepSeekService, { TaskAnalysis } from '../services/SecureDeepSeekService';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const chat = useCallback(async (message: string, context?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await SecureDeepSeekService.chat(message, context);
      return response.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeTask = useCallback(async (task: string): Promise<TaskAnalysis> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await SecureDeepSeekService.analyzeTask(task);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Task analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Removed prioritizeTasks function to avoid token consumption and performance issues
  // Use chat() function instead for AI suggestions

  const getProductivityTip = useCallback(async (currentActivity?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await SecureDeepSeekService.getProductivityTip(currentActivity);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get productivity tip';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeFocusSession = useCallback(async (
    duration: number, 
    completed: boolean, 
    mood: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await SecureDeepSeekService.analyzeFocusSession(duration, completed, mood);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getJournalInsights = useCallback(async (entry: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await SecureDeepSeekService.getJournalInsights(entry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Journal analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    chat,
    analyzeTask,
    getProductivityTip,
    analyzeFocusSession,
    getJournalInsights
  };
};

export default useAI;