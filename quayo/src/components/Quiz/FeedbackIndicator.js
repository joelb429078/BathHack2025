// src/components/Quiz/FeedbackIndicator.js
import React from 'react';
import { Check, X } from "lucide-react";

const FeedbackIndicator = ({ result, showHints }) => {
  if (!result) return null;
  
  if (result === "not-submitted") {
    return (
      <div className="mt-2 text-sm font-medium text-blue-600 flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
          <span className="block w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
        </div>
        Answer required
      </div>
    );
  }
  
  if (result === "correct" && showHints) {
    return (
      <div className="mt-2 text-sm font-medium text-emerald-600 flex items-center gap-1.5 animate-fadeIn">
        <Check size={16} className="text-emerald-600" />
        Correct!
      </div>
    );
  }
  
  if (result === "incorrect" && showHints) {
    return (
      <div className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1.5 animate-fadeIn">
        <X size={16} className="text-red-600" />
        Incorrect
      </div>
    );
  }
  
  return null;
};

export default FeedbackIndicator;