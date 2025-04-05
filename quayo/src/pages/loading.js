import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ 
  text = "Loading...", 
  type = "default", 
  size = "medium", 
  fullScreen = false,
  theme = "light"
}) => {
  // Size configurations
  const sizes = {
    small: { dot: 6, gap: 4 },
    medium: { dot: 8, gap: 6 },
    large: { dot: 12, gap: 8 }
  };
  
  const { dot, gap } = sizes[size] || sizes.medium;
  
  // Theme configurations
  const themes = {
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      textColor: '#333',
      dotColor: 'rgba(66, 133, 244, 0.8)'  // Google blue
    },
    dark: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      textColor: '#fff',
      dotColor: 'rgba(138, 180, 248, 0.9)'  // Lighter blue for dark mode
    },
    blue: {
      backgroundColor: 'rgba(66, 133, 244, 0.15)',
      textColor: '#1a73e8',
      dotColor: '#1a73e8'
    },
    gradient: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#333',
      dotColor: null // Will use gradient instead
    }
  };
  
  const themeConfig = themes[theme] || themes.light;
  
  const container = {
    show: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  
  const dot_variants = {
    hidden: { 
      y: "0%",
      opacity: 0.5
    },
    show: {
      y: ["0%", "-70%", "0%"],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop"
      }
    }
  };

  const pulse_variants = {
    hidden: { 
      scale: 0.8,
      opacity: 0.6
    },
    show: {
      scale: [0.8, 1.2, 0.8],
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop"
      }
    }
  };
  
  const spin_variants = {
    hidden: { 
      rotate: 0
    },
    show: {
      rotate: 360,
      transition: {
        duration: 1.2,
        ease: "linear",
        repeat: Infinity
      }
    }
  };

  // Function to render different spinner types
  const renderSpinner = () => {
    switch(type) {
      case 'dots':
        return (
          <motion.div
            className="flex items-center justify-center gap-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {[0, 1, 2].map(index => (
              <motion.div
                key={index}
                variants={dot_variants}
                style={{
                  width: `${dot}px`,
                  height: `${dot}px`,
                  borderRadius: '50%',
                  background: themeConfig.dotColor,
                  margin: `0 ${gap}px`
                }}
              />
            ))}
          </motion.div>
        );
        
      case 'pulse':
        return (
          <motion.div
            variants={pulse_variants}
            initial="hidden"
            animate="show"
            className="w-16 h-16 rounded-full"
            style={{
              background: theme === 'gradient' 
                ? 'linear-gradient(45deg, #4285F4, #EA4335, #FBBC05, #34A853)' 
                : themeConfig.dotColor
            }}
          />
        );
        
      case 'spinner':
        return (
          <motion.div
            variants={spin_variants}
            initial="hidden"
            animate="show"
            className="w-12 h-12 rounded-full border-4 border-t-transparent"
            style={{
              borderColor: theme === 'gradient' 
                ? '#4285F4 #EA4335 #FBBC05 #34A853' 
                : `transparent ${themeConfig.dotColor} ${themeConfig.dotColor} ${themeConfig.dotColor}`
            }}
          />
        );
        
      case 'progress':
        return (
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="h-full rounded-full"
              style={{
                background: theme === 'gradient'
                  ? 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)'
                  : themeConfig.dotColor
              }}
            />
          </div>
        );
        
      default: // default type is a mix of spinner and pulse
        return (
          <div className="relative">
            <motion.div
              variants={spin_variants}
              initial="hidden"
              animate="show"
              className="w-16 h-16 rounded-full border-4 border-b-transparent border-l-transparent"
              style={{
                borderColor: theme === 'gradient' 
                  ? '#4285F4 transparent #FBBC05 transparent' 
                  : `${themeConfig.dotColor} transparent ${themeConfig.dotColor} transparent`
              }}
            />
            <motion.div 
              variants={pulse_variants}
              initial="hidden"
              animate="show"
              className="absolute inset-0 m-auto w-8 h-8 rounded-full"
              style={{
                background: theme === 'gradient' 
                  ? 'linear-gradient(45deg, #EA4335, #34A853)' 
                  : themeConfig.dotColor,
                opacity: 0.7
              }}
            />
          </div>
        );
    }
  };

  // Main content
  const loadingContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      {renderSpinner()}
      {text && (
        <div 
          className={`mt-4 text-center font-medium ${size === 'large' ? 'text-xl' : size === 'small' ? 'text-sm' : 'text-base'}`}
          style={{ color: themeConfig.textColor }}
        >
          {text}
        </div>
      )}
    </div>
  );

  // Return either fullscreen or inline version
  return fullScreen ? (
    <div className="fixed inset-0 flex items-center justify-center z-50" 
         style={{ backgroundColor: themeConfig.backgroundColor }}>
      {loadingContent}
    </div>
  ) : (
    <div className="flex items-center justify-center p-4">
      {loadingContent}
    </div>
  );
};

export default Loading;