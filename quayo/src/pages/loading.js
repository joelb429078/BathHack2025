import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ 
  text = "Loading...", 
  size = "medium", 
  fullScreen = false
}) => {
  // Define spinner dimensions based on the size prop
  const sizes = {
    small: { spinner: 24, border: 3 },
    medium: { spinner: 40, border: 4 },
    large: { spinner: 64, border: 6 }
  };
  const { spinner, border } = sizes[size] || sizes.medium;

  // Blue spinner style with a transparent top border for the effect
  const spinnerStyle = {
    width: `${spinner}px`,
    height: `${spinner}px`,
    border: `${border}px solid #1a73e8`,
    borderTopColor: "transparent",
    borderRadius: "50%"
  };

  // Container for spinner and text
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        style={spinnerStyle}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, ease: "linear", repeat: Infinity }}
      />
      {text && (
        <div
          className={`font-medium ${
            size === "large" ? "text-xl" : size === "small" ? "text-sm" : "text-base"
          }`}
          style={{ color: "#1a73e8" }}
        >
          {text}
        </div>
      )}
    </div>
  );

  // Return full screen or inline version based on the fullScreen prop
  return fullScreen ? (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: "rgba(66, 133, 244, 0.15)" }}
    >
      {content}
    </div>
  ) : (
    <div className="flex items-center justify-center p-4" style={{ color: "#1a73e8" }}>
      {content}
    </div>
  );
};

export default Loading;
