// src/components/Results/StaticQuestionViewer.js
import React, { useState, useEffect } from 'react';
import {
  StaticSingleChoiceAnswer,
  StaticMultiChoiceAnswer,
  StaticTrueFalseAnswer,
  StaticFormattedTextDisplay,
  StaticNumericSliderAnswer,
  StaticDiscreteSliderAnswer,
  StaticRankingAnswer,
  StaticMatchingPairsAnswer,
  StaticShortTextAnswer,
  StaticSingleCheckbox,
  StaticToggleButton
} from './StaticAnswerComponents';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 650;

const StaticQuestionViewer = ({ question, response, style = {} }) => {
  const [canvasScale, setCanvasScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  const staticOverlay = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'transparent',
    cursor: 'not-allowed',
    zIndex: 10
  };

  // Handle responsive scaling
  useEffect(() => {
    if (!containerRef) return;

    const handleResize = () => {
      const containerRect = containerRef.getBoundingClientRect();
      setContainerWidth(containerRect.width);
      
      // Calculate scale factor based on container width
      const availableWidth = containerRect.width;
      let scaleFactor = Math.min(availableWidth / CANVAS_WIDTH, 1);
      
      // Minimum scale to ensure legibility on mobile
      if (window.innerWidth < 480) {
        scaleFactor = Math.max(scaleFactor, 0.4);
      } else if (window.innerWidth < 768) {
        scaleFactor = Math.max(scaleFactor, 0.5);
      } else if (window.innerWidth < 1024) {
        scaleFactor = Math.max(scaleFactor, 0.6);
      }
      
      setCanvasScale(scaleFactor);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef]);

  // Debug the response data
  useEffect(() => {
    if (response && question) {
      console.log(`DEBUG - StaticQuestionViewer - Question ${question.id}:`, question);
      console.log(`DEBUG - StaticQuestionViewer - Response for Question ${question.id}:`, response);
      
      // Additional logging to help debug data structure
      console.log("Response keys:", Object.keys(response));
      
      // Look for any keys with this question's ID
      const keysWithQuestionId = Object.keys(response || {}).filter(
        key => key.includes(String(question.id))
      );
      
      if (keysWithQuestionId.length > 0) {
        console.log(`Keys containing questionId ${question.id}:`, keysWithQuestionId);
        keysWithQuestionId.forEach(key => {
          console.log(`${key}:`, response[key]);
        });
      }
    }
  }, [question, response]);

  const getComponentStyle = (comp) => {
    const { position, width, height } = comp;
    return {
      position: 'absolute',
      left: position?.left || 0,
      top: position?.top || 0,
      width: width ? `${width}px` : 'auto',
      height: height ? `${height}px` : 'auto',
      ...style
    };
  };

  const getContainerStyle = () => {
    if (question?.backgroundColor) {
      return { backgroundColor: question.backgroundColor };
    }
    return {};
  };

  // Enhanced answer retrieval for flat data structure
  const getUserAnswer = (comp) => {
    if (!response) return undefined;
    
    // Direct nested access
    let answer;
    
    // Try nested structure first
    if (response.answers && response.answers[question.id]) {
      answer = response.answers[question.id][comp.id];
    }
    
    // If not found, try flat dot-notation directly on response
    if (answer === undefined) {
      const flatKey = `answers.${question.id}.${comp.id}`;
      if (response[flatKey] !== undefined) {
        answer = response[flatKey];
      }
    }
    
    // Try alternate flat pattern where component values are stored in an object
    if (answer === undefined) {
      const questionAnswersKey = `answers.${question.id}`;
      if (response[questionAnswersKey] && response[questionAnswersKey][comp.id] !== undefined) {
        answer = response[questionAnswersKey][comp.id];
      }
    }
    
    // Also check for "answers.1" where 1 is the question ID (not nested)
    if (answer === undefined) {
      // Find any keys that match the pattern "answers.[questionId]"
      const answerKeys = Object.keys(response || {}).filter(key => 
        key.startsWith('answers.') && key.split('.')[1] === String(question.id)
      );
      
      // If we found matching keys, look for component ID
      if (answerKeys.length > 0) {
        const answerKey = answerKeys[0];
        const questionAnswers = response[answerKey];
        
        if (questionAnswers && questionAnswers[comp.id] !== undefined) {
          answer = questionAnswers[comp.id];
        }
      }
    }
    
    console.log(`DEBUG - getUserAnswer for Q${question.id} Comp${comp.id}:`, {
      foundAnswer: answer,
      possibleKeys: Object.keys(response || {}).filter(k => k.startsWith('answers')),
    });
    
    return answer;
  };

  // Enhanced status retrieval for flat data structure
  const getComponentStatus = (comp) => {
    if (!response) return null;
    
    // Try nested access first
    let status;
    
    if (response.componentStatus && response.componentStatus[question.id]) {
      status = response.componentStatus[question.id][comp.id];
    }
    
    // Try flat key access
    if (status === undefined) {
      const flatKey = `componentStatus.${question.id}.${comp.id}`;
      if (response[flatKey] !== undefined) {
        status = response[flatKey];
      }
    }
    
    // Try alternate flat format
    if (status === undefined) {
      const statusKey = `componentStatus.${question.id}`;
      if (response[statusKey] && response[statusKey][comp.id] !== undefined) {
        status = response[statusKey][comp.id];
      }
    }
    
    // Last resort: search keys with pattern matching
    if (status === undefined) {
      const statusKeys = Object.keys(response || {}).filter(key => 
        key.startsWith('componentStatus.') && key.includes(String(question.id))
      );
      
      if (statusKeys.length > 0) {
        // Try to find the right component
        for (const key of statusKeys) {
          const parts = key.split('.');
          // If the key pattern includes the component ID
          if (parts.length > 2 && parts[1] === String(question.id) && parts[2] === String(comp.id)) {
            status = response[key];
            break;
          }
        }
      }
    }
    
    console.log(`DEBUG - getComponentStatus for Q${question.id} Comp${comp.id}:`, {
      foundStatus: status,
      possibleKeys: Object.keys(response || {}).filter(k => k.startsWith('componentStatus'))
    });
    
    return status;
  };

  return (
    <div 
      className="w-full overflow-hidden"
      ref={setContainerRef}
    >
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          ...getContainerStyle(),
          height: `${CANVAS_HEIGHT * canvasScale}px`,
          maxWidth: `${CANVAS_WIDTH}px`,
          margin: '0 auto'
        }}
      >
        {/* Static overlay to prevent interactions */}
        <div style={staticOverlay} />

        {/* Canvas with scaled content */}
        <div
          style={{
            position: 'absolute',
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `scale(${canvasScale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Render each component */}
          {question?.components?.map((comp) => {
            const answer = getUserAnswer(comp);
            const status = getComponentStatus(comp);
            const compStyle = getComponentStyle(comp);
            
            switch (comp.type) {
              case 'text':
                return (
                  <div key={comp.id} style={compStyle}>
                    <StaticFormattedTextDisplay 
                      text={comp.text?.text || comp.text}
                      format={comp.text?.format || {
                        bold: false,
                        italic: false,
                        align: 'left',
                        size: 'text-base',
                        color: 'text-gray-900'
                      }}
                    />
                  </div>
                );

              case 'multiple_choice_single':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col w-full">
                      <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <span className="text-xs font-medium text-gray-500">Select one option</span>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <StaticSingleChoiceAnswer
                          options={comp.options}
                          value={answer}
                        />
                      </div>
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'multiple_choice_multi':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col w-full">
                      <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <span className="text-xs font-medium text-gray-500">Select multiple options</span>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <StaticMultiChoiceAnswer
                          options={comp.options || []}
                          value={answer || []}
                        />
                      </div>
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'true_false':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-2">
                      <StaticTrueFalseAnswer
                        value={answer}
                      />
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'short_text_answer':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {comp.label || "Short Text Answer:"}
                      </label>
                      <StaticShortTextAnswer value={answer || ''} />
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'single_checkbox':
                return (
                  <div key={comp.id} style={compStyle}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-center">
                      <StaticSingleCheckbox
                        value={answer || false}
                        label={comp.label || "Optional Checkbox"}
                      />
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'toggle_button':
                return (
                  <div key={comp.id} style={compStyle}>
                    <StaticToggleButton
                      value={answer || false}
                      onLabel={comp.onLabel || "Toggled On"}
                      offLabel={comp.offLabel || "Toggled Off"}
                      width={comp.width ? `${comp.width}px` : '100%'}
                      height={comp.height ? `${comp.height}px` : '100%'}
                    />
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'image_upload':
                return (
                  <div key={comp.id} style={compStyle} className="overflow-hidden rounded-lg">
                    {comp.image ? (
                      <img
                        src={comp.image}
                        alt="Question"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                );

              case 'numeric_slider':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      {comp.label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {comp.label}
                        </label>
                      )}
                      <StaticNumericSliderAnswer
                        value={answer !== undefined ? answer : comp.minValue}
                        minValue={comp.minValue}
                        maxValue={comp.maxValue}
                        targetValue={comp.targetValue}
                        mode={comp.mode}
                      />
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'discrete_slider':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      {comp.label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {comp.label}
                        </label>
                      )}
                      <StaticDiscreteSliderAnswer
                        value={answer !== undefined ? answer : 0}
                        options={comp.options}
                      />
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'ranking':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                      {comp.label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {comp.label}
                        </label>
                      )}
                      <StaticRankingAnswer
                        items={comp.items || []}
                        currentOrder={answer || comp.items?.map((_, i) => i) || []}
                      />
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'matching_pairs':
                return (
                  <div key={comp.id} style={compStyle} className="flex flex-col h-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                      <StaticMatchingPairsAnswer
                        pairs={comp.pairs || []}
                        value={answer || []}
                      />
                    </div>
                    {status && (
                      <div className={`mt-2 text-sm font-medium ${
                        status === 'correct' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {status === 'correct' 
                          ? '✓ Correct' 
                          : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                );

              case 'shape':
                return (
                  <div key={comp.id} style={compStyle}>
                    <div 
                      style={{
                        backgroundColor: comp.backgroundColor || "#4A90E2",
                        opacity: comp.opacity !== undefined ? comp.opacity : 1,
                        transform: `rotate(${comp.rotation || 0}deg)`,
                        borderWidth: comp.borderWidth ? `${comp.borderWidth}px` : "0px",
                        borderColor: comp.borderColor || "#000",
                        borderStyle: comp.borderStyle || "solid",
                        width: "100%",
                        height: "100%",
                        borderRadius: comp.shapeType === "circle" ? "50%" : (comp.borderRadius ? `${comp.borderRadius}px` : 0),
                        clipPath: comp.shapeType === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : 
                                comp.shapeType === "star" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" :
                                comp.shapeType === "hexagon" ? "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)" : "none"
                      }}
                    />
                  </div>
                );

              case 'line':
                return (
                  <svg 
                    key={comp.id} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  >
                    <line
                      x1={comp.x1}
                      y1={comp.y1}
                      x2={comp.x2}
                      y2={comp.y2}
                      stroke={comp.color || "#000"}
                      strokeWidth={comp.width || "2"}
                      strokeDasharray={comp.dashed ? "5,5" : ""}
                    />
                  </svg>
                );

              default:
                return (
                  <div key={comp.id} style={compStyle} className="flex items-center justify-center bg-gray-100 rounded p-2">
                    <span className="text-xs text-gray-500">Unsupported component: {comp.type}</span>
                  </div>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default StaticQuestionViewer;