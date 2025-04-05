import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Rnd } from "react-rnd";

const CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = 600;

const BaseDraggable = ({
  id,
  type,
  position,
  children,
  className = "",
  onDelete,
  style = {},
  width,
  height,
  onResize,
  minWidth = 200,
  minHeight = 120,
  maxBottom,
  onDragStart,
  onDragStop: customDragStop,
}) => {
  const [dimensions, setDimensions] = useState({
    width: width || style.width || 320,
    height: height || style.height || 160,
  });

  const [pos, setPos] = useState({
    x: position.left || 0,
    y: position.top || 0,
  });

  useEffect(() => {
    setDimensions({
      width: width || style.width || 320,
      height: height || style.height || 160,
    });
  }, [width, height, style]);

  useEffect(() => {
    setPos({
      x: position.left || 0,
      y: position.top || 0,
    });
  }, [position.left, position.top]);

  const allowedBottom = typeof maxBottom !== "undefined" ? maxBottom : CONTAINER_HEIGHT;
  const maxHeight = allowedBottom - (position.top || 0);

  const handleDragStart = (e, d) => {
    if (onDragStart) {
      onDragStart(e, d);
    }
  };

  const handleDragStop = (e, d) => {
    const newX = Math.max(0, Math.min(d.x, CONTAINER_WIDTH - dimensions.width));
    const newY = Math.max(0, Math.min(d.y, CONTAINER_HEIGHT - dimensions.height));
    
    setPos({ x: newX, y: newY });
    
    if (customDragStop) {
      customDragStop(e, { x: newX, y: newY }); // Pass clamped coordinates
    } else {
      window.dispatchEvent(
        new CustomEvent("componentDropped", {
          detail: {
            id,
            type,
            x: newX,
            y: newY,
          },
        })
      );
    }
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    let newDimensions = {
      width: dimensions.width + delta.width,
      height: dimensions.height + delta.height,
    };

    newDimensions.width = Math.min(newDimensions.width, CONTAINER_WIDTH - pos.x);
    newDimensions.height = Math.min(newDimensions.height, maxHeight);

    setDimensions(newDimensions);
    if (onResize) {
      onResize(id, newDimensions);
    }
  };

  return (
    <Rnd
      size={{ width: dimensions.width, height: dimensions.height }}
      position={{ x: pos.x, y: pos.y }}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={minWidth}
      minHeight={minHeight}
      maxHeight={maxHeight}
      enableResizing={{
        bottomRight: true,
      }}
      resizeHandleStyles={{
        bottomRight: { cursor: "se-resize" },
      }}
      resizeHandleComponent={{
        bottomRight: (
          <div
            className="w-3 h-3 bg-transparent hover:bg-blue-200 transition-colors"
          />
        ),
      }}
      bounds="parent"
      className={`absolute rounded-lg shadow-lg border-2 border-gray-300 bg-white
        hover:shadow-xl group ${className}`}
      style={{
        opacity: 1,
        transition: "box-shadow 0.2s",
        ...style,
      }}
    >
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white
              rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600
              transition-opacity z-10 shadow-lg"
          >
            <X size={14} />
          </button>
        )}
        {children}
      </div>
    </Rnd>
  );
};

export default BaseDraggable;