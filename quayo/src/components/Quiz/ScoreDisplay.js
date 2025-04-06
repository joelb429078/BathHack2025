// src/components/Quiz/ScoreDisplay.js
import React from 'react';
import { Award } from "lucide-react";

const ScoreDisplay = ({ score, totalPossible }) => {
  const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
  
  return (
    <div className="flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 shadow-md flex items-center gap-4">
        <div className="bg-indigo-100 text-indigo-800 p-3 rounded-full">
          <Award size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">Current Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{score}</span>
            <span className="text-gray-500 text-sm">/ {totalPossible}</span>
            <span className="text-sm font-medium ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;