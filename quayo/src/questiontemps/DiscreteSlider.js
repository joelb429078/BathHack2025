// DiscreteSlider.js
import React, { useState } from 'react';
import BaseDraggable from './BaseDraggable';
import { SlidersHorizontal, Plus, Edit2, Check } from 'lucide-react';

const DiscreteSlider = ({
  id,
  position,
  options = [],
  selectedIndex,
  onUpdate,
  onDelete,
  width = 320,
  height = 160,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const handleOptionEdit = (index, newLabel) => {
    const updatedOptions = [...options];
    updatedOptions[index] = newLabel;
    onUpdate(id, { options: updatedOptions });
    setEditingOptionIndex(null);
  };

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    const updatedOptions = [...options, newOptionLabel];
    onUpdate(id, { options: updatedOptions });
    setNewOptionLabel('');
  };

  const handleSelectionChange = (index) => {
    onUpdate(id, { selectedIndex: index });
  };

  // When the component is resized, update its width and height via onUpdate.
  const handleResize = (componentId, dimensions) => {
    onUpdate(id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  return (
    <BaseDraggable
      id={id}
      type="discrete_slider"
      position={position}
      className="bg-white"
      onDelete={onDelete}
      onResize={handleResize}
      width={width}
      height={height}
      minWidth={200}
      minHeight={120}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="font-medium text-gray-700 flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Labeled Slider
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
            data-nodrag="true"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                {editingOptionIndex === index ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={option}
                      onChange={(e) => {
                        const updatedOptions = [...options];
                        updatedOptions[index] = e.target.value;
                        onUpdate(id, { options: updatedOptions });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleOptionEdit(index, option);
                        if (e.key === 'Escape') setEditingOptionIndex(null);
                      }}
                      className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-nodrag="true"
                    />
                    <button
                      onClick={() => handleOptionEdit(index, option)}
                      className="p-1 rounded-full hover:bg-green-100 text-green-600"
                      data-nodrag="true"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingOptionIndex(index)}
                    className="flex-1 text-left px-2 py-1 text-sm hover:bg-gray-50 rounded"
                    data-nodrag="true"
                  >
                    {option}
                  </button>
                )}
              </div>
            ))}

            {/* Add new option */}
            <div className="flex items-center gap-2 mt-2">
              <input
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                placeholder="Add new option..."
                className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddOption();
                }}
                data-nodrag="true"
              />
              <button
                onClick={handleAddOption}
                className="p-1.5 rounded-full hover:bg-blue-100 text-blue-600"
                disabled={!newOptionLabel.trim()}
                data-nodrag="true"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Slider */}
            <div className="relative h-1 bg-gray-200 rounded" data-nodrag="true">
              <div
                className="absolute h-full bg-blue-500 rounded"
                style={{
                  width: `${(selectedIndex / (options.length - 1)) * 100}%`
                }}
              />
              {options.map((_, index) => (
                <div
                  key={index}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer"
                  style={{
                    left: `${(index / (options.length - 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: index <= selectedIndex ? '#3b82f6' : '#e5e7eb'
                  }}
                  onClick={() => handleSelectionChange(index)}
                  data-nodrag="true"
                />
              ))}
            </div>

            {/* Labels */}
            <div className="flex justify-between text-sm text-gray-600">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`text-center cursor-pointer ${
                    index === selectedIndex ? 'font-medium text-blue-600' : ''
                  }`}
                  style={{ width: `${100 / options.length}%` }}
                  onClick={() => handleSelectionChange(index)}
                  data-nodrag="true"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseDraggable>
  );
};

export default DiscreteSlider;
