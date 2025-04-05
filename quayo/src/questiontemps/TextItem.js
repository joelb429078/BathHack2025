import React, { useState, useRef, useEffect } from 'react';
import BaseDraggable from './BaseDraggable';
import { Type, Check } from 'lucide-react';

const TextItem = ({ id, position, text, setText, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(text ?? "");
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
    if (inputValue.trim() !== text) {
      setText(id, inputValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <BaseDraggable
      id={id}
      type="text"
      position={position}
      className="bg-white group"
      width="w-64"
      height="h-16"
      onDelete={onDelete} 
    >
      <div 
        className="w-full h-full p-3 flex items-center gap-3"
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
              placeholder="Enter text..."
            />
            <button
              onClick={handleBlur}
              className="ml-2 p-1 rounded-full hover:bg-gray-100 text-gray-500
                hover:text-gray-700 transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div className="flex-1 truncate text-gray-700">
            {text || "Double-click to edit"}
          </div>
        )}
      </div>
    </BaseDraggable>
  );
};

export default TextItem;