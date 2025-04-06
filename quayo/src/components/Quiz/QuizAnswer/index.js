import React, { useState, useEffect, useRef } from 'react';
import { getShuffledOrder } from '../QuizUtils';

export const SingleChoiceAnswer = ({ value, onChange, options = [] }) => {
  return (
    <div className="space-y-2 w-full">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`w-full p-3 text-left rounded-lg border transition-all ${
            value === idx 
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              value === idx ? 'border-blue-500' : 'border-gray-300'
            }`}>
              {value === idx && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </div>
            <span>{option}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export const MultiChoiceAnswer = ({ value = [], onChange, options = [] }) => {
  const handleToggle = (idx) => {
    const newValue = value.includes(idx)
      ? value.filter(i => i !== idx)
      : [...value, idx];
    onChange(newValue);
  };
  
  return (
    <div className="space-y-2 w-full">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => handleToggle(idx)}
          className={`w-full p-3 text-left rounded-lg border transition-all ${
            value.includes(idx)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              value.includes(idx) ? 'bg-blue-500 border-blue-500' : 'border-2 border-gray-300'
            }`}>
              {value.includes(idx) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span>{option}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export const TrueFalseAnswer = ({ value, onChange }) => {
  return (
    <div className="flex gap-2 w-full h-full">
      <button
        onClick={() => onChange(true)}
        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors h-full ${
          value === true
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        True
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors h-full ${
          value === false
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        False
      </button>
    </div>
  );
};

export const FormattedTextDisplay = ({ text: textProp, format: formatProp }) => {
  const text = typeof textProp === 'string' ? textProp : textProp?.text;
  const format = formatProp || (typeof textProp === 'string' ? {} : textProp?.format || {});

  const getTextClasses = () => {
    const classes = [];
    if (format.size) {
      classes.push(format.size);
    } else {
      classes.push('text-base');
    }
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
    if (format.font) {
      style.fontFamily = format.font;
    }
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

export const NumericSliderAnswer = ({
  value,
  onChange,
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
      <div className="relative w-full">
        <input
          type="range"
          min={minValue}
          max={maxValue}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
        />
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
      <div className="flex justify-between text-sm text-gray-600">
        <span>{minValue}</span>
        <span className="font-medium">{value}</span>
        <span>{maxValue}</span>
      </div>
    </div>
  );
};

export const DiscreteSliderAnswer = ({ value, onChange, options = [] }) => {
  if (!options.length) return null;
  
  return (
    <div className="space-y-4 w-full">
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
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer"
            style={{
              left: `${(index / (options.length - 1)) * 100}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: index <= value ? '#3b82f6' : '#e5e7eb'
            }}
            onClick={() => onChange(index)}
          />
        ))}
      </div>
      <div className="flex justify-between text-sm text-gray-600 w-full">
        {options.map((option, index) => (
          <div
            key={index}
            className={`text-center cursor-pointer ${
              index === value ? 'font-medium text-blue-600' : ''
            }`}
            style={{ width: `${100 / options.length}%` }}
            onClick={() => onChange(index)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export const RankingAnswer = ({ items, onChange, currentOrder: initialOrder }) => {
  const [currentOrder, setCurrentOrder] = useState(() => {
    if (initialOrder && Array.isArray(initialOrder) && initialOrder.length === items.length) {
      return initialOrder;
    }
    return getShuffledOrder(items.length);
  });

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex) return;

    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, movedItem);
    setCurrentOrder(newOrder);
    onChange(newOrder);
  };

  const handleClick = (e) => {
    e.preventDefault();
  };

  return (
    <div className="w-full space-y-2">
      {currentOrder.map((itemIndex, currentPosition) => (
        <div
          key={itemIndex}
          draggable
          onDragStart={(e) => handleDragStart(e, currentPosition)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, currentPosition)}
          onClick={handleClick}
          className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-move w-full"
        >
          <span className="text-sm font-medium text-gray-600 w-6">
            {currentPosition + 1}.
          </span>
          <span className="flex-1">{items[itemIndex]}</span>
        </div>
      ))}
    </div>
  );
};

export const MatchingPairsAnswer = ({ pairs, value = [], onChange, containerWidth, containerHeight, optionClassName = "" }) => {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [hoveredRight, setHoveredRight] = useState(null);
  const [prevValue, setPrevValue] = useState([]);
  const [previewLine, setPreviewLine] = useState(null);
  
  const leftRefs = useRef({});
  const rightRefs = useRef({});
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  const [linePositions, setLinePositions] = useState([]);
  const [animatingLines, setAnimatingLines] = useState({});

  const [leftOrder, setLeftOrder] = useState(() => getShuffledOrder(pairs.length));
  const [rightOrder, setRightOrder] = useState(() => getShuffledOrder(pairs.length));
  
  useEffect(() => {
    if (selectedLeft !== null && hoveredRight !== null) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const leftElem = leftRefs.current[selectedLeft];
      const rightElem = rightRefs.current[hoveredRight];
      
      if (leftElem && rightElem && containerRect) {
        const leftRect = leftElem.getBoundingClientRect();
        const rightRect = rightElem.getBoundingClientRect();
        
        const x1 = leftRect.right - containerRect.left;
        const y1 = leftRect.top + (leftRect.height / 2) - containerRect.top;
        const x2 = rightRect.left - containerRect.left;
        const y2 = rightRect.top + (rightRect.height / 2) - containerRect.top;
        
        setPreviewLine({ x1, y1, x2, y2 });
      }
    } else {
      setPreviewLine(null);
    }
  }, [selectedLeft, hoveredRight]);
  
  useEffect(() => {
    const newAnimatingLines = {};
    
    value.forEach(match => {
      const matchId = `${match.left}-${match.right}`;
      const existed = prevValue.some(p => p.left === match.left && p.right === match.right);
      if (!existed) {
        newAnimatingLines[matchId] = 'adding';
      }
    });
    
    prevValue.forEach(match => {
      const matchId = `${match.left}-${match.right}`;
      const stillExists = value.some(p => p.left === match.left && p.right === match.right);
      if (!stillExists) {
        newAnimatingLines[matchId] = 'removing';
        
        const leftElem = leftRefs.current[match.left];
        const rightElem = rightRefs.current[match.right];
        
        if (leftElem && rightElem && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const leftRect = leftElem.getBoundingClientRect();
          const rightRect = rightElem.getBoundingClientRect();
          
          const x1 = leftRect.right - containerRect.left;
          const y1 = leftRect.top + (leftRect.height / 2) - containerRect.top;
          const x2 = rightRect.left - containerRect.left;
          const y2 = rightRect.top + (rightRect.height / 2) - containerRect.top;
          
          setLinePositions(prev => [
            ...prev.filter(line => line.id !== matchId),
            { id: matchId, x1, y1, x2, y2 }
          ]);
        }
      }
    });
    
    setAnimatingLines(newAnimatingLines);
    
    const timeout = setTimeout(() => {
      Object.entries(newAnimatingLines).forEach(([id, status]) => {
        if (status === 'removing') {
          setLinePositions(prev => prev.filter(line => line.id !== id));
        }
      });
      setAnimatingLines({});
    }, 500);
    
    setPrevValue(value);
    
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  
  useEffect(() => {
    const updateLines = () => {
      const newLines = [];
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (!containerRect) return;
      
      value.forEach(match => {
        const matchId = `${match.left}-${match.right}`;
        const leftElem = leftRefs.current[match.left];
        const rightElem = rightRefs.current[match.right];
        
        if (!leftElem || !rightElem) return;
        
        const leftRect = leftElem.getBoundingClientRect();
        const rightRect = rightElem.getBoundingClientRect();
        
        const x1 = leftRect.right - containerRect.left;
        const y1 = leftRect.top + (leftRect.height / 2) - containerRect.top;
        const x2 = rightRect.left - containerRect.left;
        const y2 = rightRect.top + (rightRect.height / 2) - containerRect.top;
        
        newLines.push({
          id: matchId,
          x1, y1, x2, y2
        });
      });
      
      const removingLines = linePositions.filter(line => 
        animatingLines[line.id] === 'removing' && 
        !newLines.some(nl => nl.id === line.id)
      );
      
      setLinePositions([...newLines, ...removingLines]);
    };
    
    updateLines();
    window.addEventListener('resize', updateLines);
    
    return () => window.removeEventListener('resize', updateLines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animatingLines]);
  
  const handleBackgroundClick = (e) => {
    if (e.target === containerRef.current || e.target === svgRef.current) {
      setSelectedLeft(null);
      setHoveredRight(null);
    }
  };
  
  const handleLeftClick = (displayIndex, e) => {
    e.stopPropagation();
    
    const originalIndex = leftOrder[displayIndex];
    
    if (selectedLeft === originalIndex) {
      setSelectedLeft(null);
      return;
    }
    
    const matchForThisLeft = value.find(m => m.left === originalIndex);
    if (matchForThisLeft) {
      const newValue = value.filter(m => m.left !== originalIndex);
      onChange(newValue);
    }
    
    setSelectedLeft(originalIndex);
  };
  
  const handleRightClick = (displayIndex, e) => {
    e.stopPropagation();
    
    const originalIndex = rightOrder[displayIndex];
    
    if (selectedLeft === null) {
      const matchForThisRight = value.find(m => m.right === originalIndex);
      if (matchForThisRight) {
        const leftIndex = matchForThisRight.left;
        const newValue = value.filter(m => m.right !== originalIndex);
        onChange(newValue);
        setSelectedLeft(leftIndex);
      }
      return;
    }
    
    const newValue = [...value];
    const existingMatch = newValue.find(m => m.left === selectedLeft);
    if (existingMatch) {
      newValue.splice(newValue.indexOf(existingMatch), 1);
    }
    
    const existingRightMatch = newValue.find(m => m.right === originalIndex);
    if (existingRightMatch) {
      newValue.splice(newValue.indexOf(existingRightMatch), 1);
    }
    
    newValue.push({ left: selectedLeft, right: originalIndex });
    onChange(newValue);
    setSelectedLeft(null);
    setHoveredRight(null);
  };
  
  const handleRightHover = (displayIndex, isEntering) => {
    const originalIndex = rightOrder[displayIndex];
    if (isEntering) {
      setHoveredRight(originalIndex);
    } else if (hoveredRight === originalIndex) {
      setHoveredRight(null);
    }
  };
  
  const isLeftMatched = (originalIndex) => value.some(m => m.left === originalIndex);
  const isRightMatched = (originalIndex) => value.some(m => m.right === originalIndex);
  
  const getPartnerIndex = (index, side) => {
    const match = value.find(m => m[side] === index);
    return match ? (side === 'left' ? match.right : match.left) : null;
  };
  
  const buttonHeight = pairs.length > 0 ? `${90 / pairs.length}%` : 'auto';
  
  const getLineAnimationClass = (lineId) => {
    const status = animatingLines[lineId];
    if (status === 'adding') return 'animate-line-appear';
    if (status === 'removing') return 'animate-line-disappear';
    return '';
  };
  
  return (
    <div 
      className="relative w-full h-full" 
      ref={containerRef}
      onClick={handleBackgroundClick}
      style={{ 
        width: containerWidth ? `${containerWidth}px` : '100%', 
        height: containerHeight ? `${containerHeight}px` : '100%',
        cursor: selectedLeft !== null ? 'pointer' : 'default'
      }}
    >
      <style jsx>{`
        @keyframes lineAppear {
          from { stroke-dashoffset: 100%; }
          to { stroke-dashoffset: 0; }
        }
        
        @keyframes lineDisappear {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        .animate-line-appear {
          stroke-dasharray: 100%;
          animation: lineAppear 0.4s ease-in-out forwards;
        }
        
        .animate-line-disappear {
          animation: lineDisappear 0.4s ease-in-out forwards;
        }
        
        .preview-line {
          stroke-dasharray: 5;
          animation: dash 15s linear infinite;
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: 1000;
          }
        }
      `}</style>
    
      <div className="flex justify-between h-full">
        <div className="w-5/12 flex flex-col justify-between py-4">
          {leftOrder.map((originalIndex, displayIndex) => {
            const isMatched = isLeftMatched(originalIndex);
            const partnerIndex = isMatched ? getPartnerIndex(originalIndex, 'left') : null;
            
            return (
              <button
                key={`left-${originalIndex}`}
                ref={el => leftRefs.current[originalIndex] = el}
                onClick={(e) => handleLeftClick(displayIndex, e)}
                style={{ 
                  height: buttonHeight,
                  cursor: 'pointer'
                }}
                className={`w-full px-4 py-3 text-left rounded-lg transition-all duration-300 ease-in-out ${optionClassName}
                  ${selectedLeft === originalIndex 
                    ? 'border-2 border-green-500 shadow-sm' 
                    : isMatched 
                      ? 'border-2 border-green-500' 
                      : 'border border-gray-200 hover:border-green-300'}`}
                aria-label={isMatched ? `${pairs[originalIndex].left} - matched with ${pairs[partnerIndex]?.right}` : pairs[originalIndex].left}
              >
                <div className="flex justify-between items-center">
                  <span>{pairs[originalIndex].left}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="w-5/12 flex flex-col justify-between py-4">
          {rightOrder.map((originalIndex, displayIndex) => {
            const isMatched = isRightMatched(originalIndex);
            const partnerIndex = isMatched ? getPartnerIndex(originalIndex, 'right') : null;
            
            return (
              <button
                key={`right-${originalIndex}`}
                ref={el => rightRefs.current[originalIndex] = el}
                onClick={(e) => handleRightClick(displayIndex, e)}
                onMouseEnter={() => handleRightHover(displayIndex, true)}
                onMouseLeave={() => handleRightHover(displayIndex, false)}
                style={{ 
                  height: buttonHeight,
                  cursor: selectedLeft !== null ? 'pointer' : 'default' 
                }}
                className={`w-full px-4 py-3 text-left rounded-lg transition-all duration-300 ease-in-out ${optionClassName}
                  ${hoveredRight === originalIndex && selectedLeft !== null
                    ? 'border-2 border-green-500 bg-green-50' 
                    : isMatched 
                      ? 'border-2 border-green-500' 
                      : 'border border-gray-200 hover:border-green-300'}`}
                aria-label={isMatched ? `${pairs[originalIndex].right} - matched with ${pairs[partnerIndex]?.left}` : pairs[originalIndex].right}
              >
                <div className="flex justify-between items-center">
                  <span>{pairs[originalIndex].right}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <svg 
        ref={svgRef}
        className="absolute inset-0 pointer-events-none w-full h-full" 
        style={{ zIndex: 1 }}
      >
        {previewLine && selectedLeft !== null && hoveredRight !== null && (
          <line
            x1={previewLine.x1}
            y1={previewLine.y1}
            x2={previewLine.x2}
            y2={previewLine.y2}
            stroke="green"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="preview-line"
            opacity="0.6"
          />
        )}
        
        {linePositions.map(line => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="green"
            strokeWidth="2"
            className={`transition-all duration-300 ease-in-out ${getLineAnimationClass(line.id)}`}
          />
        ))}
      </svg>
    </div>
  );
};

export const ShapeAnswer = ({
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

  let extraStyle = {};
  switch (shapeType) {
    case "circle":
      extraStyle = { borderRadius: "50%" };
      break;
    case "triangle":
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
      if (borderRadius) {
        extraStyle = { borderRadius: `${borderRadius}px` };
      }
      break;
  }

  const computedStyle = { ...baseStyle, ...extraStyle };

  return <div className={`w-full h-full ${className}`} style={computedStyle} />;
};