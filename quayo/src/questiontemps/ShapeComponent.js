import React, { useState } from 'react';
import BaseDraggable from './BaseDraggable';
import { X, RotateCcw, PaintBucket, Maximize, Layers } from 'lucide-react';

const ShapeComponent = ({
  id,
  position,
  width = 120,
  height = 120,
  shapeType,
  backgroundColor = '#3B82F6',
  borderRadius = 0,
  opacity = 1,
  rotation = 0,
  borderWidth = 0,
  borderColor = '#000000',
  borderStyle = 'solid',
  onDelete,
  onUpdate
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isEditingControls, setIsEditingControls] = useState(false);

  const getShapePath = () => {
    switch (shapeType) {
      case 'triangle':
        return `polygon(50% 0%, 0% 100%, 100% 100%)`;
      case 'circle':
        return `circle(50%)`;
      case 'pentagon':
        return `polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)`;
      case 'hexagon':
        return `polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`;
      case 'star':
        return `polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)`;
      default:
        return null; // rectangle doesn't need a clip-path
    }
  };

  const handleResize = (componentId, dimensions) => {
    onUpdate(id, dimensions);
  };

  const handleControlsMouseEnter = () => {
    setIsEditingControls(true);
  };

  const handleControlsMouseLeave = () => {
    setIsEditingControls(false);
  };

  return (
    <BaseDraggable
      id={id}
      type="shape"
      position={position}
      className="group"
      onDelete={onDelete}
      onResize={handleResize}
      minWidth={20}
      minHeight={20}
      style={{ 
        width, 
        height,
        background: 'transparent', // Make BaseDraggable background transparent
        border: 'none', // Remove default border
        boxShadow: 'none' // Remove default shadow
      }}
    >
      <div 
        className="w-full h-full"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (!isEditingControls) {
            setShowControls(false);
          }
        }}
        style={{ background: 'transparent' }} // Ensure container is also transparent
      >
        <div
          className="w-full h-full"
          style={{
            backgroundColor,
            opacity,
            borderRadius: shapeType === 'rectangle' ? borderRadius : 0,
            clipPath: getShapePath(),
            transform: `rotate(${rotation}deg)`,
            border: `${borderWidth}px ${borderStyle} ${borderColor}`,
            transition: 'all 0.2s ease'
          }}
        />

        {showControls && (
          <div 
            className="absolute -top-14 left-1/2 transform -translate-x-1/2 
                       flex items-center gap-2 bg-white p-2 rounded-lg shadow-lg z-50"
            onMouseEnter={handleControlsMouseEnter}
            onMouseLeave={handleControlsMouseLeave}
            data-nodrag="true"
          >
            {/* Controls remain the same as before */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 
                         transition-colors duration-200"
              title="Delete"
              data-nodrag="true"
            >
              <X size={14} />
            </button>
            
            <div className="flex items-center gap-2 px-2 border-l border-r border-gray-200">
              <div className="flex flex-col items-center gap-1" title="Fill Color">
                <PaintBucket size={14} className="text-gray-600" />
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => onUpdate(id, { backgroundColor: e.target.value })}
                  className="w-6 h-6 cursor-pointer rounded"
                  data-nodrag="true"
                />
              </div>

              {shapeType === 'rectangle' && (
                <div className="flex flex-col items-center gap-1" title="Border Radius">
                  <Maximize size={14} className="text-gray-600" />
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={borderRadius}
                    onChange={(e) => onUpdate(id, { borderRadius: parseInt(e.target.value) })}
                    className="w-20"
                    data-nodrag="true"
                  />
                </div>
              )}

              <div className="flex flex-col items-center gap-1" title="Opacity">
                <Layers size={14} className="text-gray-600" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity * 100}
                  onChange={(e) => onUpdate(id, { opacity: parseInt(e.target.value) / 100 })}
                  className="w-20"
                  data-nodrag="true"
                />
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(id, { rotation: (rotation + 45) % 360 });
              }}
              className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 
                         transition-colors duration-200"
              title="Rotate"
              data-nodrag="true"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>
    </BaseDraggable>
  );
};

export default ShapeComponent;