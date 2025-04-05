import React, { useState, useRef } from "react";
import BaseDraggable from "./BaseDraggable";

const ToggleButtonItem = ({
  id,
  position,
  toggled = false,
  width = 100,
  height = 40,
  opacity = 1,
  onDelete,
  setToggleValue,
  setOpacityValue,
  setSize,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isActive, setIsActive] = useState(false); // Track if the component is being interacted with
  const hideTimeout = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    setToggleValue(id, !toggled);
  };

  const handleResize = (componentId, dimensions) => {
    if (setSize) {
      setSize(componentId, dimensions);
    }
  };

  const handleOpacityChange = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setOpacityValue(id, Math.max(0.2, val));
  };

  const handleMouseEnter = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 300);
  };

  // Set component as active when dragging starts
  const handleDragStart = () => {
    setIsActive(true);
  };

  // Reset active state when dragging stops and dispatch event
  const handleDragStop = (e, d) => {
    setIsActive(false);
    window.dispatchEvent(
      new CustomEvent("componentDropped", {
        detail: {
          id,
          type: "toggle_button",
          x: d.x,
          y: d.y,
        },
      })
    );
  };

  return (
    <BaseDraggable
      id={id}
      type="toggle_button"
      position={position}
      className={`group ${isActive ? "z-[10000]" : ""}`} // Dynamic z-index via class
      onDelete={onDelete}
      onResize={handleResize}
      style={{
        width,
        height,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        opacity,
        // Remove zIndex from style to prevent saving
      }}
      minWidth={30}
      minHeight={20}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
    >
      <div
        className="relative w-full h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`w-full h-full rounded-lg cursor-pointer transition-all duration-200 ${
            toggled
              ? "border-2 border-blue-500 bg-blue-50"
              : "border-2 border-gray-300 bg-white hover:border-gray-400"
          }`}
          onClick={handleToggle}
        />

        {showControls && (
          <div
            className="absolute -top-10 left-0 bg-white p-2 rounded shadow flex items-center space-x-2"
            style={{ zIndex: 9999 }} // Controls always above the toggle button
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.01"
              value={opacity < 0.2 ? 0.2 : opacity}
              onChange={handleOpacityChange}
              className="w-16"
            />
            <span className="text-xs font-semibold">
              {Math.round(Math.max(0.2, opacity) * 100)}%
            </span>
          </div>
        )}
      </div>
    </BaseDraggable>
  );
};

export default ToggleButtonItem;