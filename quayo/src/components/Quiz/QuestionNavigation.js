import React from 'react';
import { Check, X } from "lucide-react";

const QuestionNavigation = ({ questions, currentQuestionIndex, questionScores, submissionStatus, onNavigate }) => {
  return (
    <div className="flex justify-center mt-8 space-x-2">
      {questions.map((question, index) => {
        const isCorrect = !!questionScores[question.id];
        const submission = submissionStatus[question.id];
        const isIncorrect = submission && submission.status === "incorrect" && submission.attempts >= question.maxAttempts;

        return (
          <button
            key={question.id}
            onClick={() => onNavigate(index)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              index === currentQuestionIndex 
                ? 'ring-2 ring-offset-2 ring-indigo-500 bg-indigo-500 text-white' 
                : isCorrect 
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                  : isIncorrect
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isCorrect ? (
              <Check size={16} />
            ) : isIncorrect ? (
              <X size={16} />
            ) : (
              index + 1
            )}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionNavigation;