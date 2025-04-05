import React, { useState, useRef, useEffect } from 'react';
import BaseDraggable from './BaseDraggable';
import { Settings, Target } from 'lucide-react';

const NumericSlider = ({
  id,
  position,
  minValue,
  maxValue,
  targetValue,
  currentValue,
  mode,
  onUpdate,
  onDelete,
  width = 320,
  height = 160,
  quizMode = false  // if true, we're in quiz (answer) mode
}) => {
  // In quiz mode, use the provided currentValue (or minValue) directly.
  const initialValue = quizMode ? (currentValue ?? minValue) : (currentValue || 50);
  const [isEditing, setIsEditing] = useState(false);
  const [localMin, setLocalMin] = useState(minValue || 0);
  const [localMax, setLocalMax] = useState(maxValue || 100);
  const [localTarget, setLocalTarget] = useState(targetValue || 50);
  const [localValue, setLocalValue] = useState(initialValue);

  // Use a state for the container height so that it can adjust to the content.
  const [containerHeight, setContainerHeight] = useState(height);
  // Create a ref to measure the content’s height.
  const containerRef = useRef(null);

  // Update containerHeight whenever the inner content’s height changes.
  useEffect(() => {
    if (containerRef.current) {
      const newHeight = containerRef.current.scrollHeight;
      if (newHeight !== containerHeight) {
        setContainerHeight(newHeight);
        // Inform the parent (or the state that holds our components) about the new height.
        onUpdate(id, { height: newHeight });
      }
    }
  }, [isEditing, localMin, localMax, localTarget, localValue, containerHeight, id, onUpdate]);

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setLocalValue(value);
    if (quizMode) {
      // In quiz mode, pass the raw value.
      onUpdate(id, value);
    } else {
      // In builder mode, update using an object.
      onUpdate(id, { currentValue: value });
    }
  };

  const handleSettingsSave = () => {
    // Always save the target value regardless of mode.
    onUpdate(id, {
      minValue: parseInt(localMin, 10),
      maxValue: parseInt(localMax, 10),
      targetValue: parseInt(localTarget, 10),
      mode: mode
    });
    setIsEditing(false);
  };

  // When resized, pass the new dimensions to the parent via onUpdate.
  const handleResize = (componentId, dimensions) => {
    onUpdate(id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  const percentage = ((localValue - localMin) / (localMax - localMin)) * 100;

  return (
    <BaseDraggable
      id={id}
      type="numeric_slider"
      position={position}
      className="bg-white"
      onDelete={onDelete}
      onResize={handleResize}
      width={width}
      height={containerHeight}  // pass the auto-calculated height
      minWidth={200}
      minHeight={120}
    >
      {/* 
        Notice we removed "h-full" so that our content’s natural height is used.
        We attach a ref to the wrapper so we can measure its scrollHeight.
      */}
      <div ref={containerRef} className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-medium text-gray-700 flex items-center gap-2">
            <Target size={18} />
            Numeric Slider
          </div>
          {/* Only show the settings button in builder mode */}
          {!quizMode && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
              data-nodrag="true"
            >
              <Settings size={16} />
            </button>
          )}
        </div>

        <div className="p-4">
          {isEditing && !quizMode ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Min Value</label>
                  <input
                    type="number"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                    data-nodrag="true"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Max Value</label>
                  <input
                    type="number"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                    data-nodrag="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600">Target Value</label>
                <input
                  type="number"
                  value={localTarget}
                  onChange={(e) => setLocalTarget(e.target.value)}
                  min={localMin}
                  max={localMax}
                  className="w-full px-2 py-1 text-sm border rounded"
                  data-nodrag="true"
                />
              </div>

              <button
                onClick={handleSettingsSave}
                className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                data-nodrag="true"
              >
                Save Settings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{localMin}</span>
                <span className="text-sm font-medium text-green-600">
                  ans - {localTarget}
                </span>
                <span className="text-sm text-gray-600">{localMax}</span>
              </div>

              {/* Slider Track */}
              <div className="relative">
                <input
                  type="range"
                  min={localMin}
                  max={localMax}
                  value={localValue}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                  }}
                  data-nodrag="true"
                />
                {/* Target Value Line */}
                <div 
                  className="absolute top-0 w-0.5 h-4 bg-green-500"
                  style={{
                    left: `${((localTarget - localMin) / (localMax - localMin)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>

              <div className="text-center text-sm font-medium">
                Current Value: {localValue}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseDraggable>
  );
};

export default NumericSlider;
