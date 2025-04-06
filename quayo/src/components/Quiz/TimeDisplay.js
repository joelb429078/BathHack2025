// src/components/Quiz/TimeDisplay.js
import React from 'react';
import { Clock } from "lucide-react";

const TimeDisplay = ({ timeRemaining, isTimeUp }) => {
  return (
    <div className={`rounded-full py-2 px-4 flex items-center gap-2 inline-flex ${
      isTimeUp ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-indigo-100 text-indigo-800'
    }`}>
      <Clock size={18} />
      <span className="font-mono font-medium text-sm">
        {timeRemaining}
      </span>
    </div>
  );
};

export default TimeDisplay;