import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { motion } from "framer-motion";
import {
  ToggleLeft,
  Radio,
  CheckSquare,
  Edit,
  Square,
  MousePointerClick,
  SlidersHorizontal,
  Target,
  ListOrdered,
  SplitSquareHorizontal,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const toolbarComponents = [
  [
    { 
      type: "true_false", 
      icon: ToggleLeft, 
      label: "True/False",
      dimensions: { width: 128, height: 56 }
    },
    { 
      type: "multiple_choice_single", 
      icon: Radio, 
      label: "Single Choice",
      dimensions: { width: 288, height: 200 }
    },
    { 
      type: "multiple_choice_multi", 
      icon: CheckSquare, 
      label: "Multiple Choice",
      dimensions: { width: 288, height: 200 }
    },
    { 
      type: "single_checkbox", 
      icon: Square, 
      label: "Checkbox",
      dimensions: { width: 48, height: 48 }
    },
    { 
      type: "toggle_button", 
      icon: MousePointerClick, 
      label: "Toggle",
      dimensions: { width: 100, height: 40 }
    },
    { 
      type: "short_text_answer", 
      icon: Edit, 
      label: "Text",
      dimensions: { width: 256, height: 64 }
    },
  ],
  [
    { 
      type: "numeric_slider", 
      icon: Target, 
      label: "Number Slider",
      dimensions: { width: 320, height: 160 }
    },
    { 
      type: "discrete_slider", 
      icon: SlidersHorizontal, 
      label: "Label Slider",
      dimensions: { width: 320, height: 160 }
    },
    { 
      type: "ranking", 
      icon: ListOrdered, 
      label: "Ranking",
      dimensions: { width: 320, height: 220 }
    },
    { 
      type: "matching_pairs", 
      icon: SplitSquareHorizontal, 
      label: "Matching",
      dimensions: { width: 400, height: 200 }
    },
  ],
];

const ToolbarItem = ({ type, icon: Icon, label, isMobile, dimensions }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "component",
    item: { 
      type,
      dimensions // Include dimensions for center placement
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <motion.div
      ref={drag}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg
        hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : "opacity-100"}`}
      style={{ width: isMobile ? '72px' : '88px' }}
    >
      <Icon size={isMobile ? 16 : 18} className="text-gray-700" />
      <span className="text-xs font-medium text-gray-600 text-center mt-1 leading-tight">
        {label}
      </span>
    </motion.div>
  );
};

const Toolbar = ({ questionId, isLeftSidebarOpen, leftSidebarWidth = 0, isRightSidebarOpen, windowWidth }) => {
  const [isCollapsed, setIsCollapsed] = useState(windowWidth < 768);
  const [isMobile, setIsMobile] = useState(windowWidth < 768);
  
  // Update states when window size changes
  useEffect(() => {
    setIsMobile(windowWidth < 768);
    // Auto-collapse on smaller screens
    if (windowWidth < 768 && !isCollapsed) {
      setIsCollapsed(true);
    }
  }, [windowWidth, isCollapsed]);
  
  // Calculate offset for proper centering
  const calculatePosition = () => {
    // For mobile, just center in viewport
    if (windowWidth < 768) {
      return {
        left: '50%',
        transform: 'translateX(-50%)'
      };
    }
    
    // For desktop, account for both sidebars
    let leftOffset = '50%';
    
    // Calculate sidebar offsets
    const leftSidebarOffset = isLeftSidebarOpen ? leftSidebarWidth / 2 : 0;
    const rightSidebarOffset = isRightSidebarOpen ? -32 : 0; // 64px / 2
    
    // Combine offsets
    const totalOffset = leftSidebarOffset + rightSidebarOffset;
    
    if (totalOffset !== 0) {
      leftOffset = `calc(50% + ${totalOffset}px)`;
    }
    
    return {
      left: leftOffset,
      transform: 'translateX(-50%)'
    };
  };
  
  const position = calculatePosition();
  
  return (
    <div 
      className="fixed bottom-6 z-50 transition-all duration-300"
      style={{ 
        left: position.left,
        transform: position.transform
      }}
    >
      <motion.div
        key={questionId}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`${isCollapsed ? 'mb-8' : ''}`}
      >
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 relative">
          {/* Collapse toggle button */}
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 
              bg-white rounded-full p-1 shadow-md border border-gray-200"
          >
            {isCollapsed ? (
              <ChevronUp size={16} className="text-gray-600" />
            ) : (
              <ChevronDown size={16} className="text-gray-600" />
            )}
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'max-h-0 py-0' : 'max-h-48 py-2'
          }`}>
            {/* For smaller screens, show a compact grid layout */}
            {isMobile ? (
              <div className="flex flex-wrap justify-center px-2 max-w-[340px]">
                {toolbarComponents.flat().map((component) => (
                  <div key={component.type} className="p-1">
                    <ToolbarItem
                      type={component.type}
                      icon={component.icon}
                      label={component.label}
                      dimensions={component.dimensions}
                      isMobile={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // For larger screens, show the original two-row layout
              <>
                {toolbarComponents.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center justify-center px-2">
                    {row.map((component) => (
                      <ToolbarItem
                        key={component.type}
                        type={component.type}
                        icon={component.icon}
                        label={component.label}
                        dimensions={component.dimensions}
                        isMobile={false}
                      />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Toolbar;