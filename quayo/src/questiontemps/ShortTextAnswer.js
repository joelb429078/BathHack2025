import React, { useState, useRef, useEffect } from "react";
import BaseDraggable from "./BaseDraggable";
import { Type, Check } from "lucide-react";

const ShortTextAnswer = ({
  id,
  position,
  correctAnswer,
  setCorrectAnswer,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(correctAnswer ?? "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue.trim() !== correctAnswer) {
      setCorrectAnswer(id, inputValue.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  const handleResize = (componentId, dimensions) => {
    // Handle resize if needed in the parent
  };

  return (
    <BaseDraggable
      id={id}
      type="short_text_answer"
      position={position}
      className="group"
      onDelete={onDelete}
      onResize={handleResize}
      minWidth={200}
      minHeight={48}
      style={{
        width: 260,
        height: 64,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      <div
        className="w-full h-full flex items-center gap-3 p-3 rounded-lg bg-white border-2 border-gray-200 
                   hover:border-gray-300 transition-colors"
        onDoubleClick={handleDoubleClick}
      >
        <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
          <Type size={20} />
        </div>

        {isEditing ? (
          <div className="flex-1 flex items-center">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 border-b-2 border-blue-500 focus:outline-none
                bg-transparent text-gray-800"
              placeholder="Enter correct answer..."
              data-nodrag="true"
            />
            <button
              onClick={handleBlur}
              className="ml-2 p-1 rounded-full hover:bg-gray-100 text-gray-500
                hover:text-gray-700 transition-colors"
              data-nodrag="true"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div className="flex-1 truncate text-gray-700">
            {correctAnswer
              ? `Correct Answer: ${correctAnswer}`
              : "Double-click to set correct answer"}
          </div>
        )}
      </div>
    </BaseDraggable>
  );
};

export default ShortTextAnswer;