// src/components/Results/StaticAnswerComponents.js
import React from 'react';

// Static version of SingleChoiceAnswer
export const StaticSingleChoiceAnswer = ({ value, options = [] }) => {
  return (
    <div className="space-y-2 w-full p-2">
      {options.map((option, idx) => (
        <div
          key={idx}
          className={`w-full p-3 text-left rounded-lg border ${
            value === idx 
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              value === idx ? 'border-blue-500' : 'border-gray-300'
            }`}>
              {value === idx && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </div>
            <span className="flex-1">{option}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Static version of MultiChoiceAnswer
export const StaticMultiChoiceAnswer = ({ value = [], options = [] }) => {
  return (
    <div className="space-y-2 w-full p-2">
      {options.map((option, idx) => (
        <div
          key={idx}
          className={`w-full p-3 text-left rounded-lg border ${
            Array.isArray(value) && value.includes(idx)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              Array.isArray(value) && value.includes(idx) ? 'bg-blue-500 border-blue-500' : 'border-2 border-gray-300'
            }`}>
              {Array.isArray(value) && value.includes(idx) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="flex-1">{option}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Static version of TrueFalseAnswer
export const StaticTrueFalseAnswer = ({ value }) => {
  return (
    <div className="flex gap-2 w-full">
      <div
        className={`flex-1 py-2 px-4 rounded-lg font-medium text-center ${
          value === true
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        True
      </div>
      <div
        className={`flex-1 py-2 px-4 rounded-lg font-medium text-center ${
          value === false
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        False
      </div>
    </div>
  );
};

// Static version of text display
export const StaticFormattedTextDisplay = ({ text: textProp, format: formatProp }) => {
  // Handle the case where format might be passed separately or as part of the text object
  const text = typeof textProp === 'string' ? textProp : textProp?.text;
  const format = formatProp || (typeof textProp === 'string' ? {} : textProp?.format || {});

  const getTextClasses = () => {
    const classes = [];
    if (format.size) {
      classes.push(format.size);
    } else {
      classes.push('text-base');
    }

    // Only add color class if it's not a hex value
    if (format.color && !format.color.startsWith('#')) {
      classes.push(format.color);
    } else if (!format.color) {
      classes.push('text-gray-900');
    }

    if (format.bold) classes.push('font-bold');
    if (format.italic) classes.push('italic');
    
    switch (format.align) {
      case 'center': classes.push('text-center'); break;
      case 'right': classes.push('text-right'); break;
      default: classes.push('text-left');
    }
    
    return classes.join(' ');
  };

  const getTextStyle = () => {
    const style = {};
    
    // Apply font family if specified
    if (format.font) {
      style.fontFamily = format.font;
    }
    
    // Apply custom color if it's a hex value
    if (format.color && format.color.startsWith('#')) {
      style.color = format.color;
    }
    
    return style;
  };

  return (
    <div 
      className={`${getTextClasses()} w-full h-full flex items-center`}
      style={getTextStyle()}
    >
      <div className="w-full break-words">
        {text || "(No text)"}
      </div>
    </div>
  );
};

// Static version of NumericSliderAnswer
export const StaticNumericSliderAnswer = ({
  value,
  minValue,
  maxValue,
  targetValue,
  mode,
  style = {},
  className = ""
}) => {
  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
  
  return (
    <div className={`space-y-2 w-full ${className}`} style={style}>
      {/* Slider Track */}
      <div className="relative w-full">
        <div className="w-full h-2 bg-gray-200 rounded-lg">
          <div 
            className="absolute h-2 rounded-lg bg-blue-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {mode === 'target' && targetValue !== null && (
          <div 
            className="absolute top-0 w-0.5 h-4 bg-green-500"
            style={{
              left: `${((targetValue - minValue) / (maxValue - minValue)) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
      </div>

      {/* Value Display */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>{minValue}</span>
        <span className="font-medium">{value}</span>
        <span>{maxValue}</span>
      </div>
    </div>
  );
};

// Static version of DiscreteSliderAnswer
export const StaticDiscreteSliderAnswer = ({ value, options = [] }) => {
  if (!options.length) return null;
  
  return (
    <div className="space-y-4 w-full">
      {/* Visual Slider */}
      <div className="relative h-1 bg-gray-200 rounded w-full">
        <div
          className="absolute h-full bg-blue-500 rounded"
          style={{
            width: `${(value / (options.length - 1)) * 100}%`
          }}
        />
        {options.map((_, index) => (
          <div
            key={index}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{
              left: `${(index / (options.length - 1)) * 100}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: index <= value ? '#3b82f6' : '#e5e7eb'
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-sm text-gray-600 w-full">
        {options.map((option, index) => (
          <div
            key={index}
            className={`text-center ${
              index === value ? 'font-medium text-blue-600' : ''
            }`}
            style={{ width: `${100 / options.length}%` }}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

// Static version of RankingAnswer
export const StaticRankingAnswer = ({ items, currentOrder = [] }) => {
  // If currentOrder is empty or not an array, create a default order
  const safeOrder = Array.isArray(currentOrder) && currentOrder.length > 0 
    ? currentOrder 
    : items.map((_, i) => i);
  
  return (
    <div className="w-full space-y-2">
      {safeOrder.map((itemIndex, currentPosition) => (
        <div
          key={currentPosition}
          className="flex items-center gap-3 p-3 bg-white border rounded-lg w-full"
        >
          <span className="text-sm font-medium text-gray-600 w-6">
            {currentPosition + 1}.
          </span>
          <span className="flex-1">{items[itemIndex] || `Item ${itemIndex + 1}`}</span>
        </div>
      ))}
    </div>
  );
};

export const StaticMatchingPairsAnswer = ({ pairs = [], value = [] }) => {
    // Ensure value is an array
    const safeValue = Array.isArray(value) ? value : [];
    
    return (
      <div className="relative w-full h-full p-4">
        <div className="flex justify-between h-full">
          {/* Left Column */}
          <div className="w-5/12 flex flex-col justify-between">
            {pairs.map((pair, index) => {
              const isMatched = safeValue.some(m => m.left === index);
              
              return (
                <div
                  key={`left-${index}`}
                  style={{ height: pairs.length > 0 ? `${90 / pairs.length}%` : 'auto' }}
                  className={`w-full px-4 py-3 text-left rounded-lg ${
                    isMatched ? 'border-2 border-green-500' : 'border border-gray-200'
                  } flex items-center`}
                >
                  <span>{pair.left}</span>
                </div>
              );
            })}
          </div>
          
          {/* Right Column */}
          <div className="w-5/12 flex flex-col justify-between">
            {pairs.map((pair, index) => {
              const isMatched = safeValue.some(m => m.right === index);
              
              return (
                <div
                  key={`right-${index}`}
                  style={{ height: pairs.length > 0 ? `${90 / pairs.length}%` : 'auto' }}
                  className={`w-full px-4 py-3 text-left rounded-lg ${
                    isMatched ? 'border-2 border-green-500' : 'border border-gray-200'
                  } flex items-center`}
                >
                  <span>{pair.right}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Connection lines - IMPROVED to connect properly */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 1 }}>
          {safeValue.map((match, idx) => {
            // Calculate line positions based on the layout
            const leftBoxY = match.left * (90 / pairs.length) + (90 / pairs.length / 2);
            const rightBoxY = match.right * (90 / pairs.length) + (90 / pairs.length / 2);
            
            // Add padding adjustment for more accuracy (4% from top)
            const paddingTop = 4;
            const leftY = paddingTop + leftBoxY;
            const rightY = paddingTop + rightBoxY;
            
            // Fixed x positions to match the actual column widths
            // Left column ends at 5/12 of width (41.67%), right column starts at 7/12 (58.33%)
            const x1 = "41.67%"; // End of left column
            const x2 = "58.33%"; // Start of right column
            
            return (
              <line
                key={idx}
                x1={x1}
                y1={`${leftY}%`}
                x2={x2}
                y2={`${rightY}%`}
                stroke="green"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  
// Static version of ShortTextAnswer
export const StaticShortTextAnswer = ({ value = '' }) => {
  return (
    <div className="w-full">
      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-800 min-h-[38px] flex items-center">
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="text-gray-400">No answer provided</span>
        )}
      </div>
    </div>
  );
};

// Static version of SingleCheckbox
export const StaticSingleCheckbox = ({ value = false, label = "Checkbox" }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 flex items-center justify-center rounded ${
        value ? 'bg-blue-500' : 'border-2 border-gray-300 bg-white'
      }`}>
        {value && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
};

// Static version of ToggleButton
export const StaticToggleButton = ({ value = false, onLabel = "Toggled On", offLabel = "Toggled Off", width = 'auto', height = 'auto' }) => {
  return (
    <div 
      className={`relative rounded-xl shadow-sm w-full h-full ${
        value 
          ? 'bg-indigo-500 text-white border-none ring-2 ring-indigo-300' 
          : 'bg-gray-50 border border-gray-300 text-gray-700'
      }`}
      style={{ 
        width: width,
        height: height
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${value ? 'bg-white' : 'bg-gray-300'}`} />
          <span className="font-medium text-sm">
            {value ? onLabel : offLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

// Static version of ShapeAnswer
export const StaticShapeAnswer = ({
  shapeType,
  backgroundColor,
  borderRadius,
  opacity,
  rotation,
  borderWidth,
  borderColor,
  borderStyle,
  style = {},
  className = ""
}) => {
  // Base style that fills the container.
  const baseStyle = {
    backgroundColor: backgroundColor || "#4A90E2",
    opacity: opacity ?? 1,
    transform: `rotate(${rotation || 0}deg)`,
    borderWidth: borderWidth ? `${borderWidth}px` : "0px",
    borderColor: borderColor || "#000",
    borderStyle: borderStyle || "solid",
    width: "100%",
    height: "100%",
    ...style,
  };

  // Adjust style based on shapeType.
  let extraStyle = {};
  switch (shapeType) {
    case "circle":
      extraStyle = { borderRadius: "50%" };
      break;
    case "triangle":
      // A triangle using clip-path.
      extraStyle = { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" };
      break;
    case "star":
      extraStyle = { clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" };
      break;
    case "hexagon":
      extraStyle = { clipPath: "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)" };
      break;
    case "rectangle":
    default:
      // If a rectangle (or unknown type), optionally apply a borderRadius if provided.
      if (borderRadius) {
        extraStyle = { borderRadius: `${borderRadius}px` };
      }
      break;
  }

  const computedStyle = { ...baseStyle, ...extraStyle };

  return <div className={`w-full h-full ${className}`} style={computedStyle} />;
};