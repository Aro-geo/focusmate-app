import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

interface FormattedMessageProps {
  message: string;
  className?: string;
}

/**
 * A component that renders a message with basic markdown-like formatting
 * Supports:
 * - Headers (## Header)
 * - Bullet points (* item or - item)
 * - Bold (**text**)
 * - Line breaks
 */
const FormattedMessage: React.FC<FormattedMessageProps> = ({ message, className = '' }) => {
  const { darkMode } = useTheme();

  // Process the message into formatted parts
  const formatMessage = (text: string) => {
    if (!text) return [];

    // Split the message into lines
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      // Header (## text)
      if (line.startsWith('##')) {
        return (
          <motion.h3 
            key={`line-${index}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg font-bold mb-2 ${
              darkMode ? 'text-purple-300' : 'text-indigo-600'
            }`}
          >
            {line.replace(/^##\s*/, '')}
          </motion.h3>
        );
      }
      
      // Bullet point (* item or - item)
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        return (
          <motion.li 
            key={`line-${index}`}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + (index * 0.05) }}
            className="ml-4 mb-1 flex items-start"
          >
            <span className={`mr-2 mt-1 text-xs ${
              darkMode ? 'text-purple-400' : 'text-indigo-500'
            }`}>•</span>
            <span>{line.replace(/^[*-]\s*/, '')}</span>
          </motion.li>
        );
      }
      
      // Empty line - add spacing
      if (line.trim() === '') {
        return <div key={`line-${index}`} className="h-2"></div>;
      }
      
      // Regular paragraph
      return (
        <motion.p 
          key={`line-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 + (index * 0.03) }}
          className="mb-2"
        >
          {formatBold(line)}
        </motion.p>
      );
    });
  };
  
  // Format bold text (**text**)
  const formatBold = (text: string) => {
    if (!text.includes('**')) return text;
    
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`leading-relaxed ${className}`}>
      {formatMessage(message)}
    </div>
  );
};

export default FormattedMessage;
