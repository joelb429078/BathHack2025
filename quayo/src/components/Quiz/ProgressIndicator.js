import React from 'react';
import { theme } from './QuizTheme';

const ProgressIndicator = ({ questions, questionScores, submissionStatus }) => {
  const totalQuestions = questions.length;
  const completedQuestions = questions.filter(q => {
    return !!questionScores[q.id] || 
           (submissionStatus[q.id]?.attempts >= q.maxAttempts);
  }).length;
  const progressPercentage = (completedQuestions / totalQuestions) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          {completedQuestions} of {totalQuestions} complete
        </span>
        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md ml-2">
          {progressPercentage.toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full"
          style={{ 
            width: `${progressPercentage}%`, 
            backgroundColor: theme.colors.primary,
            transition: "width 0.5s ease"
          }} 
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;