import React, { useState, useEffect } from 'react';
import { GripVertical, FileText, Plus, X, Sparkles } from 'lucide-react';

const Sidebar = ({ 
  questions, 
  activeQuestionId, 
  setActiveQuestionId, 
  onAddQuestion,
  onDeleteQuestion,
  onReorderQuestions,
  sidebarWidth = 280
}) => {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // Add this new state to track newly added questions
  const [newlyAddedIds, setNewlyAddedIds] = useState([]);
  // Add this to track the highest question ID we've seen
  const [highestSeenId, setHighestSeenId] = useState(0);

  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Track new questions by monitoring changes in the questions array
  useEffect(() => {
    if (questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      const currentHighestId = Math.max(...questionIds);
      
      // If we've seen a new highest ID, we have new questions
      if (currentHighestId > highestSeenId) {
        // Calculate which questions are new (any with ID higher than our previous highest)
        const newIds = questionIds.filter(id => id > highestSeenId);
        
        // Update our tracking states
        setNewlyAddedIds(prev => [...prev, ...newIds]);
        setHighestSeenId(currentHighestId);
        
        // Auto-select the highest new ID (the most recently added question)
        if (newIds.length > 0) {
          setActiveQuestionId(currentHighestId);
        }
        
        // Remove the "new" status after 5 seconds
        const timer = setTimeout(() => {
          setNewlyAddedIds(prev => prev.filter(id => !newIds.includes(id)));
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else if (highestSeenId === 0) {
      // Initialize on first load with no questions
      setHighestSeenId(0);
    }
  }, [questions, highestSeenId, setActiveQuestionId]);

  const handleDragStart = (e, questionId) => {
    e.stopPropagation();
    setDraggedId(questionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedId !== targetId) {
      setDragOverId(targetId);
      
      const oldIndex = questions.findIndex(q => q.id === draggedId);
      const newIndex = questions.findIndex(q => q.id === targetId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newQuestions = [...questions];
        const [movedQuestion] = newQuestions.splice(oldIndex, 1);
        newQuestions.splice(newIndex, 0, movedQuestion);
        onReorderQuestions(newQuestions);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const isMobile = windowWidth < 768;

  // Add this CSS class for the pulse animation
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes pulse-light {
        0%, 100% { background-color: rgba(59, 130, 246, 0.05); }
        50% { background-color: rgba(59, 130, 246, 0.2); }
      }
      .animate-pulse-light {
        animation: pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  return (
    <div
      className="h-full flex flex-col"
      style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
    >
      <div className="px-4 sm:px-6 py-4 border-b w-full">
        <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 w-full">
        {questions.map(q => {
          const questionImage = q.components?.find(c => 
            c.type === "image_upload" && c.image
          )?.image;

          const isDragging = draggedId === q.id;
          const isOver = dragOverId === q.id;
          const isNewlyAdded = newlyAddedIds.includes(q.id);

          return (
            <div
              key={q.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, q.id)}
              onDragEnter={(e) => handleDragEnter(e, q.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, q.id)}
              onDragEnd={handleDragEnd}
              className={`group relative rounded-lg transition-all duration-200 w-full
                ${isDragging ? 'opacity-50' : 'opacity-100'}
                ${isOver ? 'border-t-2 border-blue-500' : ''}
                ${q.id === activeQuestionId 
                  ? 'bg-blue-50 ring-2 ring-blue-500' 
                  : 'hover:bg-gray-50 hover:ring-1 hover:ring-gray-200'
                }
                ${isNewlyAdded && q.id !== activeQuestionId ? 'animate-pulse-light' : ''}
              `}
            >
              {/* Add Sparkle icon for newly added questions */}
              {isNewlyAdded && (
                <div className="absolute -right-1 -top-1 text-blue-500 animate-pulse z-10">
                  <Sparkles size={16} />
                </div>
              )}
              
              <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move
                text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} />
              </div>

              <button
                onClick={() => setActiveQuestionId(q.id)}
                className="w-full text-left p-3 pl-10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gray-100 overflow-hidden">
                    {questionImage ? (
                      <img 
                        src={questionImage} 
                        alt={`Question ${q.id}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText size={isMobile ? 16 : 20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      q.id === activeQuestionId ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      Question {q.id}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {q.components?.length || 0} components
                    </p>
                  </div>
                </div>
              </button>

              {questions.length > 1 && (
                <button
                  onClick={() => onDeleteQuestion(q.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5
                    rounded-full hover:bg-red-100 text-red-500 opacity-0
                    group-hover:opacity-100 transition-opacity"
                >
                  <X size={isMobile ? 14 : 16} />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={onAddQuestion}
          className="w-full mt-4 p-3 rounded-lg border-2 border-dashed 
            border-gray-300 text-gray-600 hover:border-blue-500 
            hover:text-blue-500 transition-colors flex items-center 
            justify-center gap-2"
        >
          <Plus size={isMobile ? 16 : 18} />
          <span>Add Question</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;