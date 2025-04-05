// MCMultipleSelect.js
import React, { useState } from 'react';
import BaseDraggable from './BaseDraggable';
import { Plus, X, CheckSquare } from 'lucide-react';

const MCMultipleSelect = ({
  id,
  position,
  options,
  correctAnswers,
  updateMCmulti,
  onDelete,
  // Accept stored dimensions with fallback defaults
  width = 288,
  height = 200,
}) => {
  const [newOption, setNewOption] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // We'll replicate the gentle font-size scaling approach
  const baseHeight = 200;
  const baseFontSize = 14;
  const computedFontSize = Math.min(
    Math.max(baseFontSize * (1 + ((height / baseHeight - 1) / 3)), 12),
    24
  );
  // Some dynamic padding as a % of height
  const dynamicPadding = height * 0.05;

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    updateMCmulti(id, {
      options: [...options, newOption],
      correctAnswers
    });
    setNewOption("");
    setIsAddingNew(false);
  };

  const handleToggleCorrect = (idx) => {
    const updatedCorrectAnswers = correctAnswers.includes(idx)
      ? correctAnswers.filter(answer => answer !== idx)
      : [...correctAnswers, idx];

    updateMCmulti(id, { correctAnswers: updatedCorrectAnswers });
  };

  const handleRenameOption = (idx, newValue) => {
    const updatedOptions = options.map((opt, i) => (i === idx ? newValue : opt));
    updateMCmulti(id, { options: updatedOptions });
  };

  const handleRemoveOption = (idx) => {
    const updatedOptions = options.filter((_, i) => i !== idx);
    const updatedCorrectAnswers = correctAnswers
      .filter(answer => answer !== idx)
      .map(answer => (answer > idx ? answer - 1 : answer));

    updateMCmulti(id, {
      options: updatedOptions,
      correctAnswers: updatedCorrectAnswers
    });
  };

  // Update parent's state with new dimensions when resized
  const handleResize = (componentId, dimensions) => {
    updateMCmulti(id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  return (
    <BaseDraggable
      id={id}
      type="multiple_choice_multi"
      position={position}
      width={width}
      height={height}
      className="group"
      onDelete={onDelete}
      onResize={handleResize}
      // Use the dynamic width/height from props so they reflect state
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
      {/* Outer container: flex column filling full height */}
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
          <CheckSquare size={computedFontSize + 4} />
          Multiple Choice Question
        </div>

        {/* Options container: fill leftover vertical space */}
        <div
          className="flex-1 overflow-auto"
          style={{ marginBottom: dynamicPadding / 2 }}
        >
          <div className="flex flex-col h-full space-y-2">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className="flex flex-1 items-center gap-2 group border rounded-md"
                style={{
                  padding: `${dynamicPadding / 4}px 0`,
                  fontSize: computedFontSize,
                }}
              >
                {/* Correct Answer Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCorrect(idx);
                  }}
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                    correctAnswers.includes(idx)
                      ? 'border-2 border-blue-500 bg-blue-500'
                      : 'border-2 border-gray-300 hover:border-blue-400'
                  }`}
                  data-nodrag="true"
                >
                  {correctAnswers.includes(idx) && (
                    <div className="w-2 h-2 bg-white" />
                  )}
                </button>

                {/* Option Input */}
                <input
                  className="flex-1 bg-transparent focus:outline-none"
                  style={{ padding: '0 0.5rem' }}
                  value={opt}
                  onChange={(e) => handleRenameOption(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  data-nodrag="true"
                />

                {/* Remove Option */}
                <button
                  onClick={() => handleRemoveOption(idx)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 text-red-500 transition-opacity"
                  data-nodrag="true"
                >
                  <X size={computedFontSize} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Option Footer */}
        {isAddingNew ? (
          <div className="flex items-center gap-2">
            <div style={{ width: computedFontSize, height: computedFontSize }} />
            <input
              autoFocus
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddOption();
                if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewOption("");
                }
              }}
              onBlur={() => {
                if (newOption.trim()) handleAddOption();
                else setIsAddingNew(false);
              }}
              className="border rounded-md focus:outline-none"
              placeholder="New option..."
              style={{ flex: 1, padding: '0.5rem', fontSize: computedFontSize }}
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
    </BaseDraggable>
  );
};

export default MCMultipleSelect;
