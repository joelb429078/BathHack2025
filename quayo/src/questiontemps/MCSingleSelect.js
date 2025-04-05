// MCSingleSelect.js
import React, { useState } from 'react';
import BaseDraggable from './BaseDraggable';
import { Plus, X, Radio } from 'lucide-react';

const MCSingleSelect = ({
  id,
  position,
  options = [],
  correctIndex = null,
  updateMCsingle,
  onDelete,
  width = 288,
  height = 200,
}) => {
  const [newOption, setNewOption] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Base values for scaling
  const baseHeight = 200;
  const baseFontSize = 14;
  // Compute font size in a similar way as in MCMultipleSelect
  const computedFontSize = Math.min(
    Math.max(baseFontSize * (1 + ((height / baseHeight - 1) / 3)), 12),
    24
  );
  // Dynamic padding as a percentage of height
  const dynamicPadding = height * 0.05;

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    updateMCsingle(id, {
      options: [...(options || []), newOption],
      correctIndex,
    });
    setNewOption("");
    setIsAddingNew(false);
  };

  const handleSetCorrect = (idx) => {
    updateMCsingle(id, { correctIndex: idx });
  };

  const handleRenameOption = (idx, newValue) => {
    const updatedOptions = options.map((opt, i) => (i === idx ? newValue : opt));
    updateMCsingle(id, { options: updatedOptions });
  };

  const handleRemoveOption = (idx) => {
    const updatedOptions = options.filter((_, i) => i !== idx);
    let updatedCorrectIndex = correctIndex;
    if (correctIndex === idx) {
      updatedCorrectIndex = null;
    } else if (correctIndex > idx) {
      updatedCorrectIndex = correctIndex - 1;
    }
    updateMCsingle(id, { options: updatedOptions, correctIndex: updatedCorrectIndex });
  };

  // Make the resize function behave exactly like in MCMultipleSelect
  const handleResize = (componentId, dimensions) => {
    updateMCsingle(id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  return (
    <BaseDraggable
      id={id}
      type="multiple_choice_single"
      position={position}
      width={width}
      height={height}
      // Added an extra class "mc-select" so you can apply common styles if needed
      className="group mc-select"
      onDelete={onDelete}
      onResize={handleResize}
      style={{
        width,
        height,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
      minWidth={240}
      minHeight={120}
    >
      {/* Outer container, with the same padding and border styling as MCMultipleSelect */}
      <div
        className="flex flex-col h-full bg-white rounded-lg border-2 border-gray-200"
        style={{ padding: dynamicPadding }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: dynamicPadding / 2,
            fontSize: computedFontSize,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Radio size={computedFontSize + 4} />
          Single Choice Question
        </div>

        {/* Options Container */}
        <div
          className="flex-1 overflow-auto"
          style={{ marginBottom: dynamicPadding / 2 }}
        >
          <div className="flex flex-col h-full space-y-2">
            {(options || []).map((opt, idx) => (
              <div
                key={idx}
                className="flex flex-1 items-center gap-2 group border rounded-md"
                style={{
                  padding: `${dynamicPadding / 4}px 0`,
                  fontSize: computedFontSize,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetCorrect(idx);
                  }}
                  className={`ml-2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    correctIndex === idx
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  data-nodrag="true"
                >
                  {correctIndex === idx && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>

                <input
                  className="flex-1 bg-transparent focus:outline-none px-2"
                  value={opt}
                  onChange={(e) => handleRenameOption(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  data-nodrag="true"
                />

                <button
                  onClick={() => handleRemoveOption(idx)}
                  className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded-full hover:bg-red-100 text-red-500 transition-opacity"
                  data-nodrag="true"
                >
                  <X size={computedFontSize} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Add Option */}
        <div style={{ marginTop: dynamicPadding / 2 }}>
          {isAddingNew ? (
            <div className="flex items-center gap-2">
              <div style={{ width: computedFontSize, height: computedFontSize }} />
              <input
                autoFocus
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddOption();
                  else if (e.key === 'Escape') {
                    setIsAddingNew(false);
                    setNewOption('');
                  }
                }}
                onBlur={() => {
                  if (newOption.trim()) handleAddOption();
                  else setIsAddingNew(false);
                }}
                className="flex-1 px-2 py-1 border rounded-md focus:outline-none"
                placeholder="New option..."
                style={{ fontSize: computedFontSize }}
                data-nodrag="true"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
              style={{ fontSize: computedFontSize }}
              data-nodrag="true"
            >
              <Plus size={computedFontSize + 2} />
              Add Option
            </button>
          )}
        </div>
      </div>
    </BaseDraggable>
  );
};

export default MCSingleSelect;
