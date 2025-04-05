// TrueFalse.js
import React from 'react';
import BaseDraggable from './BaseDraggable';

const TrueFalse = ({
  id,
  position,
  value,
  setValue,
  onDelete,
  width = 128,
  height = 56,
  onUpdate, // Callback to update dimensions on resize
}) => {
  const handleResize = (componentId, dimensions) => {
    if (onUpdate) {
      onUpdate(componentId, dimensions);
    }
  };

  return (
    <BaseDraggable
      id={id}
      type="true_false"
      position={position}
      width={width}
      height={height}
      className="group"
      onDelete={onDelete}
      onResize={handleResize}
      minWidth={128}
      minHeight={56}
      style={{
        width: width,
        height: height,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200">
        <div className="flex h-full">
          <button
            className={`w-1/2 h-full flex items-center justify-center font-medium transition-all ${
              value
                ? 'bg-green-500 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setValue(id, true);
            }}
            data-nodrag="true"
          >
            <span className="transform transition-transform group-hover:scale-105">
              True
            </span>
          </button>
          <button
            className={`w-1/2 h-full flex items-center justify-center font-medium transition-all ${
              !value
                ? 'bg-red-500 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setValue(id, false);
            }}
            data-nodrag="true"
          >
            <span className="transform transition-transform group-hover:scale-105">
              False
            </span>
          </button>
        </div>
      </div>
    </BaseDraggable>
  );
};

export default TrueFalse;
