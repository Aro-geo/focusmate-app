import React from 'react';
import { motion } from 'framer-motion';

interface FocusMateAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  animated?: boolean;
  variant?: 'default' | 'minimal' | 'badge';
}

const FocusMateAvatar: React.FC<FocusMateAvatarProps> = ({ 
  size = 'md', 
  className = '', 
  animated = false,
  variant = 'default'
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  const iconSizes = {
    xs: { brain: 12, eye: 3, mouth: 8 },
    sm: { brain: 16, eye: 4, mouth: 10 },
    md: { brain: 20, eye: 5, mouth: 12 },
    lg: { brain: 24, eye: 6, mouth: 14 },
    xl: { brain: 32, eye: 8, mouth: 18 },
    '2xl': { brain: 40, eye: 10, mouth: 22 }
  };

  const sizes = iconSizes[size];

  const Container = animated ? motion.div : 'div';
  const animationProps = animated ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    whileHover: { scale: 1.05 },
    transition: { duration: 0.2 }
  } : {};

  if (variant === 'minimal') {
    return (
      <Container
        className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}
        {...animationProps}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simple brain icon */}
          <circle cx="20" cy="20" r="18" fill="#6366f1" className="opacity-10"/>
          <path
            d="M15 12c-3 0-5 2-5 5s2 5 5 5c1 0 2-.3 2.8-.8.8.5 1.8.8 2.8.8 3 0 5-2 5-5s-2-5-5-5c-1 0-2 .3-2.8.8-.8-.5-1.8-.8-2.8-.8z"
            fill="#6366f1"
            className="opacity-80"
          />
          <path
            d="M15 22c-3 0-5 2-5 5s2 5 5 5c1 0 2-.3 2.8-.8.8.5 1.8.8 2.8.8 3 0 5-2 5-5s-2-5-5-5c-1 0-2 .3-2.8.8-.8-.5-1.8-.8-2.8-.8z"
            fill="#6366f1"
            className="opacity-60"
          />
        </svg>
      </Container>
    );
  }

  if (variant === 'badge') {
    return (
      <Container
        className={`${sizeClasses[size]} ${className} relative flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg`}
        {...animationProps}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-3/4 h-3/4 text-white"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 8c-3.5 0-6.5 2-8 5-1.5-3-4.5-5-8-5-4.4 0-8 3.6-8 8s3.6 8 8 8c1.8 0 3.4-.6 4.7-1.6.3 1.1.8 2.1 1.5 3 1.5 2 3.8 3.2 6.3 3.2s4.8-1.2 6.3-3.2c.7-.9 1.2-1.9 1.5-3 1.3 1 2.9 1.6 4.7 1.6 4.4 0 8-3.6 8-8s-3.6-8-8-8c-3.5 0-6.5 2-8 5z"/>
        </svg>
      </Container>
    );
  }

  return (
    <Container
      className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}
      {...animationProps}
    >
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        {/* Main circle background */}
        <circle 
          cx="20" 
          cy="20" 
          r="19" 
          fill="url(#avatarGradient)"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        
        {/* Brain/focus symbol */}
        <g transform="translate(20, 20)">
          {/* Upper brain lobes */}
          <circle cx="-4" cy="-6" r="4.5" fill="url(#brainGradient)" opacity="0.9"/>
          <circle cx="4" cy="-6" r="4.5" fill="url(#brainGradient)" opacity="0.9"/>
          
          {/* Lower brain lobes */}
          <circle cx="-3" cy="2" r="4" fill="url(#brainGradient)" opacity="0.8"/>
          <circle cx="3" cy="2" r="4" fill="url(#brainGradient)" opacity="0.8"/>
          
          {/* Central connection */}
          <ellipse cx="0" cy="-2" rx="2" ry="3" fill="url(#brainGradient)" opacity="0.7"/>
          
          {/* Focus eyes */}
          <circle cx="-2.5" cy="-6" r="1" fill="#6366f1" opacity="0.8"/>
          <circle cx="2.5" cy="-6" r="1" fill="#6366f1" opacity="0.8"/>
          
          {/* Focus pupils */}
          <circle cx="-2.5" cy="-6" r="0.5" fill="#1e293b"/>
          <circle cx="2.5" cy="-6" r="0.5" fill="#1e293b"/>
          
          {/* Zen smile */}
          <path 
            d="M -3 1 Q 0 4 3 1" 
            stroke="#6366f1" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
        
        {/* Subtle glow effect */}
        <circle 
          cx="20" 
          cy="20" 
          r="19" 
          fill="none"
          stroke="url(#avatarGradient)"
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>
      
      {/* Optional floating particles for animation */}
      {animated && (
        <>
          <motion.div
            className="absolute top-1 right-1 w-1 h-1 bg-yellow-400 rounded-full opacity-60"
            animate={{
              y: [-2, -6, -2],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1 left-1 w-1 h-1 bg-blue-400 rounded-full opacity-60"
            animate={{
              y: [2, 6, 2],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </>
      )}
    </Container>
  );
};

export default FocusMateAvatar;
export { FocusMateAvatar };
