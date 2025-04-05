import React, { useRef, useEffect } from "react";
import { useDrag } from "react-dnd";
import { motion } from "framer-motion";
import { 
  Type, 
  Image, 
  Slash,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Star
} from "lucide-react";

const rightToolbarItems = [
  {
    type: "text",
    icon: Type,
    label: "Text",
    dimensions: { width: 256, height: 64 }
  },
  {
    type: "image_upload",
    icon: Image,
    label: "Image Upload",
    dimensions: { width: 160, height: 160 }
  },
  {
    type: "line",
    icon: Slash,
    label: "Line",
    dimensions: { width: 100, height: 2 }
  },
  {
    type: "shape",
    shapeType: "rectangle",
    icon: Square,
    label: "Rectangle",
    dimensions: { width: 100, height: 100 }
  },
  {
    type: "shape",
    shapeType: "circle",
    icon: Circle,
    label: "Circle",
    dimensions: { width: 100, height: 100 }
  },
  {
    type: "shape",
    shapeType: "triangle",
    icon: Triangle,
    label: "Triangle",
    dimensions: { width: 100, height: 100 }
  },
  {
    type: "shape",
    shapeType: "hexagon",
    icon: Hexagon,
    label: "Hexagon",
    dimensions: { width: 100, height: 100 }
  },
  {
    type: "shape",
    shapeType: "star",
    icon: Star,
    label: "Star",
    dimensions: { width: 100, height: 100 }
  },
];

const RightToolbarItem = ({ type, shapeType, icon: Icon, label, dimensions, isMobile }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "component",
    item: { 
      type,
      shapeType,
      dimensions
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
      className={`flex flex-col items-center gap-1 py-3 rounded-lg
        hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : "opacity-100"}`}
      style={{ 
        width: '100%',
        padding: isMobile ? '0.5rem 0' : '0.75rem 0' 
      }}
    >
      <Icon size={isMobile ? 20 : 24} className="text-gray-700" />
      <span className="text-xs font-medium text-gray-600 text-center">{label}</span>
    </motion.div>
  );
};

const RightToolbar = () => {
  const isMobile = window.innerWidth < 768;
  const containerRef = useRef(null);
  
  // Set up isolated scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const preventPropagation = (e) => {
      e.stopPropagation();
    };
    
    container.addEventListener('wheel', preventPropagation, { passive: false });
    container.addEventListener('touchmove', preventPropagation, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', preventPropagation);
      container.removeEventListener('touchmove', preventPropagation);
    };
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="h-full bg-white flex flex-col items-center py-2 overflow-y-auto"
      style={{ 
        scrollbarWidth: 'thin',
        overscrollBehavior: 'contain',
        isolation: 'isolate',
        zIndex: 10
      }}
    >
      <div className="w-full px-1 flex flex-col items-center">
        {rightToolbarItems.map((item) => (
          <RightToolbarItem
            key={item.type + (item.shapeType || '')}
            type={item.type}
            shapeType={item.shapeType}
            icon={item.icon}
            label={item.label}
            dimensions={item.dimensions}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
};

export default RightToolbar;