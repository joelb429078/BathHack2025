import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  XCircle, 
  Star, 
  Clock, 
  ChevronRight,
  RotateCw 
} from "lucide-react";
import ResizableComponent from './ResizeableComponent';
import { defaultSizes } from './QuizTheme';
import FeedbackIndicator from './FeedbackIndicator';
import { 
  SingleChoiceAnswer,
  MultiChoiceAnswer,
  TrueFalseAnswer, 
  FormattedTextDisplay, 
  NumericSliderAnswer, 
  DiscreteSliderAnswer, 
  MatchingPairsAnswer, 
  ShapeAnswer,
  RankingAnswer 
} from "./QuizAnswer";
import { getShuffledOrder } from './QuizUtils';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 650;

const QuestionCard = ({ 
  question, 
  index, 
  answers, 
  updateAnswer, 
  validationResults,
  attemptsUsed,
  questionScores,
  submittingQuestions,
  handleSubmitQuestion,
  sessionSettings,
  timeIsUp
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      setWindowWidth(newWidth);
      setWindowHeight(newHeight);
      
      const headerFooterSpace = 120;
      const availableWidth = newWidth - 8;
      const availableHeight = newHeight - headerFooterSpace;
      
      const widthScale = Math.min(availableWidth, 800) / CANVAS_WIDTH;
      const heightScale = Math.min(availableHeight, 650) / CANVAS_HEIGHT;
      
      let scaleFactor = Math.min(widthScale, heightScale);
      
      if (newHeight < 500 && newWidth > newHeight) {
        scaleFactor = Math.max(scaleFactor, 0.85);
      } else if (newWidth < 480) {
        scaleFactor = Math.max(scaleFactor, 0.8);
      } else if (newWidth < 768) {
        scaleFactor = Math.max(scaleFactor, 0.9);
      } else if (newWidth < 1024) {
        scaleFactor = Math.max(scaleFactor, 0.9);
      }
      
      scaleFactor = Math.min(scaleFactor, 1);
      
      setCanvasScale(scaleFactor);
      
      const isPhone = newWidth < 768;
      if (isPhone && newWidth < newHeight) {
        setShowOrientationWarning(true);
      } else {
        setShowOrientationWarning(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const used = attemptsUsed[question.id] || 0;
  const attemptsLeft = Math.max(question.maxAttempts - used, 0);
  const alreadyCorrect = !!questionScores[question.id];
  const submitDisabled = attemptsLeft <= 0 || alreadyCorrect || timeIsUp;

  const backgroundColor = question.backgroundColor || "white";

  return (
    <div 
      className="rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-lg border border-gray-100 relative animate-slideIn" 
      style={{ 
        animationDelay: `${index * 0.1}s`,
        backgroundColor: backgroundColor
      }}
    >
      {showOrientationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex flex-col items-center justify-center text-white p-6">
          <div className="transform mb-4">
            <RotateCw size={64} className="rotate-90 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-2">Please Rotate Your Device</h2>
          <p className="text-center mb-4">This quiz requires landscape mode to properly display questions and interact with components.</p>
          <p className="text-center text-indigo-300 text-sm">
            <Clock size={16} className="inline mr-1" />
            Rotate your device to continue
          </p>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-3 sm:p-6 border-b border-indigo-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 mb-1 sm:mb-2 text-indigo-700 bg-white px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-sm border border-indigo-200">
              <span className="font-medium text-sm sm:text-base">Question {index + 1}</span>
              <span className="text-xs bg-indigo-100 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">{question.points} pts</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {question.title || `Question ${index + 1}`}
            </h2>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">
              {alreadyCorrect ? (
                <span className="text-emerald-600 font-medium">{questionScores[question.id]} points earned</span>
              ) : (
                <span>
                  Attempts: <span className="font-medium">{used}/{question.maxAttempts}</span>
                </span>
              )}
            </div>
            {!alreadyCorrect && (
              <div className="flex space-x-1">
                {Array.from({ length: question.maxAttempts }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      i < used 
                        ? 'bg-gray-400' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {alreadyCorrect && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center max-w-sm mx-auto transform transition-all">
            <div className="rounded-full bg-emerald-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-700 mb-2">Well done!</h3>
            <p className="text-emerald-600 mb-4">
              You earned {questionScores[question.id]} point{questionScores[question.id] !== 1 ? 's' : ''} in {used} attempt{used !== 1 ? 's' : ''} out of {question.maxAttempts}.
            </p>
            <div className="inline-flex items-center text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              <Star size={16} className="mr-1" />
              <span>Completed</span>
            </div>
          </div>
        </div>
      )}
      
      {!alreadyCorrect && attemptsLeft <= 0 && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-red-600/30 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center max-w-sm mx-auto">
            <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-2">No more attempts</h3>
            <p className="text-red-600 mb-4">
              You've used all {question.maxAttempts} attempts for this question.
            </p>
            <div className="inline-flex items-center text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">
              <X size={16} className="mr-1" />
              <span>No attempts left</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative px-0 py-1 flex justify-center canvas-wrapper">
        <div 
          className="mx-auto relative canvas-container flex justify-center items-center" 
          style={{ 
            minHeight: '150px',
            width: '100%',
            maxWidth: `${CANVAS_WIDTH}px`,
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            backgroundColor: backgroundColor,
            overflow: 'visible'
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${canvasScale})`,
              transformOrigin: 'center center',
              left: '50%',
              top: '50%',
              marginLeft: `-${CANVAS_WIDTH/2}px`,
              marginTop: `-${CANVAS_HEIGHT/2}px`
            }}
          >
          {question.components?.map((comp) => {
            const compResult = validationResults[question.id]?.[comp.id];
            const renderFeedback = <FeedbackIndicator result={compResult} showHints={sessionSettings.showComponentHints} />;

            if (comp.type === "text") {
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.text.width}
                  defaultHeight={defaultSizes.text.height}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      fontFamily: comp.text?.format?.font || "Inter, sans-serif",
                    }}
                  >
                    <FormattedTextDisplay text={comp.text} />
                  </div>
                </ResizableComponent>
              );
            }

            if (comp.type === "image_upload") {
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.image_upload.width}
                  defaultHeight={defaultSizes.image_upload.height}
                  extraStyle={{ overflow: "hidden", borderRadius: "0.75rem" }}
                >
                  {comp.image ? (
                    <img
                      src={comp.image}
                      alt="Question"
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg border border-gray-200">
                      No Image
                    </div>
                  )}
                  {compResult && renderFeedback}
                </ResizableComponent>
              );
            }

            if (comp.type === "line") {
              return (
                <div
                  key={comp.id}
                  style={{
                    position: "absolute",
                    left: "0px",
                    top: "0px",
                    width: `${CANVAS_WIDTH}px`,
                    height: `${CANVAS_HEIGHT}px`,
                    pointerEvents: "none",
                  }}
                >
                  <svg width="100%" height="100%" style={{ pointerEvents: "none", background: "transparent" }}>
                    <line x1={comp.x1} y1={comp.y1} x2={comp.x2} y2={comp.y2} stroke="#000" strokeWidth={2} />
                  </svg>
                </div>
              );
            }

            if (comp.type === "multiple_choice_single") {
              const val = answers[question.id]?.[comp.id] ?? null;
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.multiple_choice_single.width}
                  defaultHeight={defaultSizes.multiple_choice_single.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <span className="text-xs font-medium text-gray-500">Select one option</span>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      <SingleChoiceAnswer
                        value={val}
                        onChange={(newVal) => updateAnswer(question.id, comp.id, newVal)}
                        options={comp.options || []}
                      />
                    </div>
                  </div>
                  {compResult && renderFeedback}
                </ResizableComponent>
              );
            }

            if (comp.type === "multiple_choice_multi") {
              const val = answers[question.id]?.[comp.id] || [];
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.multiple_choice_multi.width}
                  defaultHeight={defaultSizes.multiple_choice_multi.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <span className="text-xs font-medium text-gray-500">Select multiple options</span>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      <MultiChoiceAnswer
                        value={val}
                        onChange={(newVal) => updateAnswer(question.id, comp.id, newVal)}
                        options={comp.options || []}
                      />
                    </div>
                  </div>
                  {compResult && renderFeedback}
                </ResizableComponent>
              );
            }

            if (comp.type === "true_false") {
              const val = answers[question.id]?.[comp.id];
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.true_false.width}
                  defaultHeight={defaultSizes.true_false.height}
                >
                  <div className="w-full h-full flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-2">
                    <TrueFalseAnswer
                      value={val}
                      onChange={(val2) => updateAnswer(question.id, comp.id, val2)}
                    />
                  </div>
                  {compResult && renderFeedback}
                </ResizableComponent>
              );
            }

            if (comp.type === "short_text_answer") {
              const val = answers[question.id]?.[comp.id] || "";
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.short_text_answer.width}
                  defaultHeight={defaultSizes.short_text_answer.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Text Answer:
                    </label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateAnswer(question.id, comp.id, e.target.value)}
                      placeholder="Type your answer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
                    />
                    {compResult && renderFeedback}
                  </div>
                </ResizableComponent>
              );
            }

            if (comp.type === "single_checkbox") {
              const userVal = answers[question.id]?.[comp.id];
              const checked = userVal === undefined ? false : userVal;
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.single_checkbox.width}
                  defaultHeight={defaultSizes.single_checkbox.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-center">
                    <div className="relative w-8 h-8">
                      <input
                        type="checkbox"
                        className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                        checked={checked}
                        onChange={(e) => updateAnswer(question.id, comp.id, e.target.checked)}
                      />
                      <div className={`w-8 h-8 border-2 rounded-md flex items-center justify-center transition-colors ${
                        checked ? 'bg-indigo-50 border-indigo-500' : 'border-gray-300'
                      }`}>
                        {checked && (
                          <Check size={20} className="text-indigo-600 animate-fadeIn" />
                        )}
                      </div>
                    </div>
                  </div>
                  {compResult && renderFeedback}
                </ResizableComponent>
              );
            }

            if (comp.type === "toggle_button") {
              const userVal = answers[question.id]?.[comp.id];
              const toggled = userVal === undefined ? false : userVal;
              const opacity = comp.opacity ?? 1;
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.toggle_button.width}
                  defaultHeight={defaultSizes.toggle_button.height}
                >
                  <button
                    onClick={() => updateAnswer(question.id, comp.id, !toggled)}
                    className={`w-full h-full relative rounded-xl transition-all shadow-sm ${
                      toggled 
                        ? 'bg-indigo-500 text-white border-none ring-2 ring-indigo-300' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                    style={{ opacity }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${toggled ? 'bg-white' : 'bg-gray-300'}`} />
                        <span className="font-medium text-sm">
                          {toggled ? "Toggled On" : "Click to Toggle"}
                        </span>
                      </div>
                    </div>
                  </button>
                  {compResult && renderFeedback}
                </ResizableComponent>
              );
            }

            if (comp.type === "numeric_slider") {
              const val = answers[question.id]?.[comp.id] ?? comp.minValue;
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.numeric_slider.width}
                  defaultHeight={defaultSizes.numeric_slider.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <NumericSliderAnswer
                      value={val}
                      onChange={(newVal) => updateAnswer(question.id, comp.id, newVal)}
                      minValue={comp.minValue}
                      maxValue={comp.maxValue}
                      targetValue={comp.targetValue}
                      mode={comp.mode}
                      className="w-full"
                      style={{ width: "100%", height: "100%" }}
                    />
                    {compResult && renderFeedback}
                  </div>
                </ResizableComponent>
              );
            }

            if (comp.type === "discrete_slider") {
              const val = answers[question.id]?.[comp.id] ?? 0;
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.discrete_slider.width}
                  defaultHeight={defaultSizes.discrete_slider.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <DiscreteSliderAnswer
                      value={val}
                      onChange={(newVal) => updateAnswer(question.id, comp.id, newVal)}
                      options={comp.options}
                    />
                    {compResult && renderFeedback}
                  </div>
                </ResizableComponent>
              );
            }

            if (comp.type === "ranking") {
              const currentOrder = answers[question.id]?.[comp.id] || getShuffledOrder(comp.items.length);
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.ranking.width}
                  defaultHeight={defaultSizes.ranking.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <RankingAnswer
                      items={comp.items || []}
                      currentOrder={currentOrder}
                      onChange={(newOrder) => updateAnswer(question.id, comp.id, newOrder)}
                    />
                    {compResult && renderFeedback}
                  </div>
                </ResizableComponent>
              );
            }

            if (comp.type === "matching_pairs") {
              const currentMatches = answers[question.id]?.[comp.id] || [];
              const compWidth = comp.width || defaultSizes.matching_pairs.width;
              const compHeight = comp.height || defaultSizes.matching_pairs.height;
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.matching_pairs.width}
                  defaultHeight={defaultSizes.matching_pairs.height}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{ width: `${compWidth}px`, height: `${compHeight}px` }}
                    >
                      <MatchingPairsAnswer
                        pairs={comp.pairs}
                        value={currentMatches}
                        onChange={(newMatches) =>
                          updateAnswer(question.id, comp.id, newMatches)
                        }
                        containerWidth={compWidth}
                        containerHeight={compHeight}
                        optionClassName="bg-white hover:bg-indigo-50 border-2 hover:border-indigo-300 transition-colors"
                      />
                    </div>
                    {compResult && renderFeedback}
                  </div>
                </ResizableComponent>
              );
            }

            if (comp.type === "shape") {
              return (
                <ResizableComponent
                  key={comp.id}
                  comp={comp}
                  defaultWidth={defaultSizes.shape.width}
                  defaultHeight={defaultSizes.shape.height}
                >
                  <div className="bg-transparent w-full h-full">
                    <ShapeAnswer
                      shapeType={comp.shapeType || "rectangle"}
                      backgroundColor={comp.backgroundColor || "#4A90E2"}
                      borderRadius={comp.borderRadius}
                      opacity={comp.opacity || 1}
                      rotation={comp.rotation || 0}
                      borderWidth={comp.borderWidth || 0}
                      borderColor={comp.borderColor || "transparent"}
                      borderStyle={comp.borderStyle || "solid"}
                      className="w-full h-full"
                    />
                  </div>
                  {compResult && renderFeedback}
                </ResizableComponent>
              );
            }

            return null;
          })}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs sm:text-sm text-gray-500">
          {attemptsLeft > 0 && !alreadyCorrect ? (
            <span className="flex items-center">
              <Clock size={14} className="mr-1" />
              {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left
            </span>
          ) : alreadyCorrect ? (
            <span className="flex items-center text-emerald-600">
              <Check size={14} className="mr-1" />
              Complete
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <X size={14} className="mr-1" />
              No attempts left
            </span>
          )}
        </div>
        
        <button
          onClick={() => handleSubmitQuestion(question.id)}
          disabled={submitDisabled || submittingQuestions[question.id]}
          className={`flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all ${
            submitDisabled || submittingQuestions[question.id]
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
          }`}
        >
          {submittingQuestions[question.id] ? (
            <>
              <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Submit Answer</span>
              <ChevronRight size={8} className="sm:size-8" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;