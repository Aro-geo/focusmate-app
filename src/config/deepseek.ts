/**
 * DeepSeek V2.5 Configuration
 * Temperature settings optimized for different use cases
 */

export const DEEPSEEK_CONFIG = {
  model: 'deepseek-chat',
  temperatures: {
    // Coding / Math - Precise, deterministic responses
    coding: 0.0,
    
    // Data Cleaning / Data Analysis - Balanced creativity and accuracy
    analysis: 1.0,
    
    // General Conversation - Natural, engaging responses
    conversation: 1.3,
    
    // Translation - Natural language flow while maintaining accuracy
    translation: 1.3,
    
    // Creative Writing / Poetry - Maximum creativity and variation
    creative: 1.5
  },
  
  // Max tokens for different use cases
  maxTokens: {
    coding: 1000,
    analysis: 500,
    conversation: 300,
    translation: 200,
    creative: 800
  }
} as const;

export type UseCaseType = keyof typeof DEEPSEEK_CONFIG.temperatures;