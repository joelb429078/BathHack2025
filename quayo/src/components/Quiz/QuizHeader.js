import React from 'react';
import ShareButton from './ShareButton';
import TimeDisplay from './TimeDisplay';
import ScoreDisplay from './ScoreDisplay.js';
import ProgressIndicator from './ProgressIndicator';
import { calculateTotalPossibleScore } from './QuizUtils';

const QuizHeader = ({ 
  formData, 
  respondentData, 
  timeRemaining, 
  isTimeUp, 
  totalScore, 
  totalPossible, 
  questions, 
  questionScores,
  submissionStatus 
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-lg overflow-hidden mb-8">
      {formData?.formImage && (
        <div className="w-full h-48 sm:h-64 overflow-hidden relative">
          <img
            src={formData.formImage}
            alt="Quiz header"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30" /> 
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {formData?.formTitle}
            </h1>
          </div>
        </div>
      )}
      
      <div className="p-6 sm:p-8">
        {!formData?.formImage && (
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {formData?.formTitle}
          </h1>
        )}
        
        {formData?.formDescription && (
          <p className="text-indigo-100 text-lg mb-6 max-w-3xl">
            {formData.formDescription}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="bg-white text-indigo-600 rounded-full p-2 w-10 h-10 flex items-center justify-center font-bold">
              {questions.length}
            </div>
            <span className="text-indigo-100">Questions</span>
            
            {timeRemaining && (
              <TimeDisplay timeRemaining={timeRemaining} isTimeUp={isTimeUp} />
            )}
          </div>
          
          <ShareButton />
        </div>
      </div>
      
      <div className="bg-white p-6 border-t border-indigo-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
              {respondentData?.name ? respondentData.name.charAt(0).toUpperCase() : "G"}
            </div>
            <div>
              <span className="text-xs text-gray-500">Logged in as</span>
              <p className="font-medium text-gray-800">
                {respondentData?.name || "Guest User"}
              </p>
            </div>
          </div>
          
          <ScoreDisplay score={totalScore} totalPossible={totalPossible || calculateTotalPossibleScore(questions)} />
          
          <div className="w-full md:w-1/3">
            <ProgressIndicator 
              questions={questions} 
              questionScores={questionScores} 
              submissionStatus={submissionStatus} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizHeader;