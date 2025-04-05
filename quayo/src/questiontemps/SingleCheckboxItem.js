// SingleCheckboxItem.js
import React from "react";
import BaseDraggable from "./BaseDraggable";

const SingleCheckboxItem = ({
  id,
  position,
  correctValue,
  setCorrectValue,
  onDelete,
  setSize, // Callback to update dimensions on resize
}) => {
  const handleToggle = () => {
    setCorrectValue(id, !correctValue);
  };

  // When the component is resized, call setSize (if provided) with the new dimensions.
  const handleResize = (componentId, dimensions) => {
    if (setSize) {
      setSize(componentId, dimensions);
    }
  };

  return (
    <BaseDraggable
      id={id}
      type="single_checkbox"
      position={position}
      className="group"
      onDelete={onDelete}
      onResize={handleResize}
      minWidth={48}
      minHeight={48}
      style={{
        width: 48,
        height: 48,
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    >
      <div className="w-full h-full flex items-center justify-center rounded-lg bg-white border-2 border-gray-200 hover:border-gray-300">
        <input
          type="checkbox"
          checked={!!correctValue}
          onChange={handleToggle}
          className="w-6 h-6 accent-blue-500 cursor-pointer"
          data-nodrag="true"
        />
      </div>
    </BaseDraggable>
  );
};

export default SingleCheckboxItem;
