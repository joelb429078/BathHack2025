import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { v4 as uuidv4 } from "uuid";
import {
  Box,
  CheckSquare,
  Image as ImageIcon,
  Edit,
  Save,
  Type,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import BaseDraggable from "./BaseDraggable";

// DnD item types
const TOOL_ITEM = "TOOL_ITEM";
const CANVAS_ITEM = "CANVAS_ITEM";

// Component types with their configurations
const COMPONENT_TYPES = {
  checkbox: {
    icon: CheckSquare,
    label: "Checkbox",
    defaultValue: false,
  },
  text: {
    icon: Type,
    label: "Text",
    defaultValue: "Double-click to edit",
  },
  image: {
    icon: ImageIcon,
    label: "Image",
    defaultValue: null,
  },
  alert: {
    icon: AlertCircle,
    label: "Alert",
    defaultValue: "Important note",
  },
};

// Toolbar Item Component
const ToolbarItem = ({ toolType }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: TOOL_ITEM,
    item: { toolType },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const ComponentIcon = COMPONENT_TYPES[toolType].icon;

  return (
    <div
      ref={dragRef}
      className={`flex flex-col items-center gap-1 p-2 border rounded-lg shadow-md cursor-move
        ${isDragging ? "bg-gray-300" : "bg-white hover:bg-gray-50"}`}
    >
      <ComponentIcon size={20} />
      <span className="text-xs font-medium">
        {COMPONENT_TYPES[toolType].label}
      </span>
    </div>
  );
};

// Static Base Component
const StaticBase = ({ id, left, top, isSelected, onClick, className, children }) => (
  <div
    onClick={onClick}
    style={{
      position: "absolute",
      left,
      top,
      transition: "all 0.2s ease",
    }}
    className={`${isSelected ? "ring-2 ring-blue-500" : ""} ${className}`}
  >
    {children}
  </div>
);

// Draggable Base Component
const DraggableBase = ({ id, left, top, isSelected, onClick, onDelete, children }) => {
  const [{ isDragging }, dragRef, dragPreviewRef] = useDrag(() => ({
    type: CANVAS_ITEM,
    item: { id, left, top },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragPreviewRef}
      style={{
        position: "absolute",
        left,
        top,
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={onClick}
      className={`${isSelected ? "ring-2 ring-blue-500" : ""}`}
    >
      <div ref={dragRef} className="cursor-move">
        {children}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5
                   flex items-center justify-center text-xs hover:bg-red-600
                   transform hover:scale-110 transition-transform"
      >
        ×
      </button>
    </div>
  );
};

function CustomComponent({
  id,
  position,
  subItems = [],
  relationships = [],
  onUpdateSubItems,
  onDelete,
  isQuizMode = false,
  forceReadOnly = false,
  value,
  onChange,
}) {
  // Initialize with proper position data
  const [localSubItems, setLocalSubItems] = useState(
    (value?.subItems || subItems).map((item) => ({
      ...item,
      position: item.position || { left: 0, top: 0 },
    }))
  );
  const [localRelationships, setLocalRelationships] = useState(
    value?.relationships || relationships
  );
  const [isEditing, setIsEditing] = useState(!isQuizMode && !forceReadOnly);
  const [selectedItems, setSelectedItems] = useState([]);
  const canvasRef = useRef(null);

  // Keep the parent (Canvas/Question) in sync
  const updateParent = useCallback(() => {
    const updates = {
      subItems: localSubItems.map((item) => ({
        ...item,
        position: item.position || { left: 0, top: 0 },
      })),
      relationships: localRelationships,
      type: "custom_component",
      position: position || { left: 0, top: 0 },
    };

    onUpdateSubItems?.(updates);
    if (isQuizMode && onChange) {
      onChange(updates);
    }
  }, [
    localSubItems,
    localRelationships,
    onUpdateSubItems,
    onChange,
    isQuizMode,
    position,
  ]);

  useEffect(() => {
    updateParent();
  }, [localSubItems, localRelationships, updateParent]);

  // Handle incoming value updates (when reloading from Firestore, etc.)
  useEffect(() => {
    if (value) {
      setLocalSubItems(
        (value.subItems || []).map((item) => ({
          ...item,
          position: item.position || { left: 0, top: 0 },
        }))
      );
      setLocalRelationships(value.relationships || []);
    }
  }, [value]);

  // -- Update handlers --
  const handleItemClick = useCallback(
    (itemId, event) => {
      event.stopPropagation();
      if (!isEditing) return;

      setSelectedItems((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((id) => id !== itemId);
        }
        if (prev.length < 2) {
          return [...prev, itemId];
        }
        // If you want a rolling selection of 2, shift the first out:
        return [prev[1], itemId];
      });
    },
    [isEditing]
  );

  // For checkboxes or anything that sets item.value
  const handleUpdateValue = useCallback((itemId, newValue) => {
    setLocalSubItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, value: newValue } : item))
    );
  }, []);

  // For text/alert items that store free text in item.text
  const handleUpdateText = useCallback((itemId, text) => {
    setLocalSubItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, text } : item))
    );
  }, []);

  // For image items
  const handleUpdateImage = useCallback((itemId, image) => {
    setLocalSubItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, image } : item))
    );
  }, []);

  // Relationship creation
  const handleCreateRelationship = useCallback(() => {
    if (selectedItems.length !== 2) return;

    const newRelationship = {
      id: uuidv4(),
      sourceId: selectedItems[0],
      targetId: selectedItems[1],
      type: "depends_on",
    };

    setLocalRelationships((prev) => [...prev, newRelationship]);
    setSelectedItems([]);
  }, [selectedItems]);

  // Drop handler for new sub-items or repositioning existing ones
  const [, dropRef] = useDrop({
    accept: [TOOL_ITEM, CANVAS_ITEM],
    canDrop: () => isEditing,
    drop: (draggedItem, monitor) => {
      if (!canvasRef.current) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const left = Math.max(0, clientOffset.x - canvasRect.left);
      const top = Math.max(0, clientOffset.y - canvasRect.top);

      if (monitor.getItemType() === TOOL_ITEM) {
        // Dropping a new toolbar item
        const newSubItem = {
          id: uuidv4(),
          type: draggedItem.toolType,
          position: { left, top },
          value: COMPONENT_TYPES[draggedItem.toolType].defaultValue,
          text: "",
          image: null,
        };
        setLocalSubItems((prev) => [...prev, newSubItem]);
      } else {
        // Repositioning an existing item
        setLocalSubItems((prev) =>
          prev.map((item) =>
            item.id === draggedItem.id ? { ...item, position: { left, top } } : item
          )
        );
      }
    },
  });

  // Delete a single sub‐item from this custom component
  const handleDeleteItem = useCallback((itemId) => {
    setLocalSubItems((prev) => prev.filter((item) => item.id !== itemId));
    setLocalRelationships((prev) =>
      prev.filter((rel) => rel.sourceId !== itemId && rel.targetId !== itemId)
    );
    setSelectedItems((prev) => prev.filter((id) => id !== itemId));
  }, []);

  // Relationship UI
  const renderRelationshipUI = () => (
    <div className="flex flex-col gap-2 border-t border-gray-200 p-2 bg-gray-50">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {selectedItems.length === 0
            ? "Click items to connect them"
            : selectedItems.length === 1
            ? "Select another item"
            : "Ready to connect!"}
        </span>
        {selectedItems.length === 2 && (
          <button
            onClick={handleCreateRelationship}
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 
                     rounded-md hover:bg-blue-600 transition-colors"
          >
            <LinkIcon size={16} />
            Connect Items
          </button>
        )}
      </div>
      {selectedItems.length > 0 && (
        <div className="flex gap-2">
          {selectedItems.map((itemId, index) => {
            const item = localSubItems.find((i) => i.id === itemId);
            return (
              <div
                key={itemId}
                className="flex items-center gap-1 px-2 py-1
                           bg-blue-100 text-blue-800 rounded-md text-sm"
              >
                {`Item ${index + 1}: ${item?.type || "Unknown"}`}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItems((prev) => prev.filter((id) => id !== itemId));
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Rendering each sub‐item
  const renderItem = (item) => {
    const isSelected = selectedItems.includes(item.id);
    const commonProps = {
      key: item.id,
      id: item.id,
      left: item.position?.left || 0,
      top: item.position?.top || 0,
      isSelected,
      onClick: (e) => handleItemClick(item.id, e),
    };

    // EDIT MODE
    if (isEditing) {
      return (
        <DraggableBase {...commonProps} onDelete={handleDeleteItem}>
          {item.type === "checkbox" && (
            <div className="w-8 h-8 bg-white border rounded">
              <input
                type="checkbox"
                className="w-full h-full cursor-move accent-blue-500"
                checked={!!item.value}
                onChange={() => handleUpdateValue(item.id, !item.value)}
              />
            </div>
          )}

          {item.type === "text" && (
            <div className="w-40 bg-white border rounded p-2">
              <textarea
                className="w-full text-sm border-none resize-none focus:outline-none cursor-move"
                defaultValue={item.text || ""}
                onBlur={(e) => handleUpdateText(item.id, e.target.value)}
                placeholder="Enter text..."
              />
            </div>
          )}

          {item.type === "image" && (
            <div className="w-24 h-24 bg-white border rounded overflow-hidden relative">
              <div className="w-full h-full flex items-center justify-center cursor-move">
                {item.image ? (
                  <img
                    src={item.image}
                    alt="upload"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Click to upload</span>
                )}
              </div>
              {/* Transparent file input for uploading */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => handleUpdateImage(item.id, reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          )}

          {item.type === "alert" && (
            <div className="w-48 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-400 flex-shrink-0" size={16} />
                <textarea
                  className="flex-1 text-sm bg-transparent border-none resize-none focus:outline-none cursor-move"
                  defaultValue={item.text || ""}
                  onBlur={(e) => handleUpdateText(item.id, e.target.value)}
                  placeholder="Alert text..."
                />
              </div>
            </div>
          )}
        </DraggableBase>
      );
    }

    // VIEW (READ-ONLY) MODE
    return (
      <StaticBase {...commonProps}>
        {item.type === "checkbox" && (
          <div className="w-8 h-8 bg-white border rounded">
            <input
              type="checkbox"
              className="w-full h-full accent-blue-500"
              checked={!!item.value}
              readOnly
            />
          </div>
        )}

        {item.type === "text" && (
          <div className="w-40 bg-white border rounded p-2">
            <div className="text-sm whitespace-pre-wrap">{item.text || "(No Text)"}</div>
          </div>
        )}

        {item.type === "image" && (
          <div className="w-24 h-24 bg-white border rounded overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt="uploaded"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
        )}

        {item.type === "alert" && (
          <div className="w-48 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-400 flex-shrink-0" size={16} />
              <p className="text-sm text-yellow-700">
                {item.text || "Important note"}
              </p>
            </div>
          </div>
        )}
      </StaticBase>
    );
  };

  return (
    <BaseDraggable
      id={id}
      type="custom_component"
      position={position}
      className="bg-white border border-gray-300 rounded-lg shadow-lg"
      width="w-96"
      height="h-96"
      onDelete={!isQuizMode && !forceReadOnly ? onDelete : undefined}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Box size={16} className="text-gray-600" />
            <p className="text-gray-600 font-medium">Custom Component</p>
          </div>
          {!forceReadOnly && (
            <div className="flex items-center gap-2">
              {isEditing && selectedItems.length > 0 && (
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Selection
                </button>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1
                         rounded hover:bg-blue-600 transition-colors text-sm"
              >
                {isEditing ? (
                  <>
                    <Save size={16} />
                    Save
                  </>
                ) : (
                  <>
                    <Edit size={16} />
                    Edit
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Toolbar + Relationship UI in Edit Mode */}
        {isEditing && !forceReadOnly && (
          <>
            <div className="flex justify-between p-2 border-b bg-gray-50">
              <div className="flex gap-2">
                {Object.keys(COMPONENT_TYPES).map((type) => (
                  <ToolbarItem key={type} toolType={type} />
                ))}
              </div>
            </div>
            {renderRelationshipUI()}
          </>
        )}

        {/* Canvas Area */}
        <div
          ref={(node) => {
            if (!forceReadOnly) {
              dropRef(node);
            }
            canvasRef.current = node;
          }}
          className="relative flex-1 bg-gray-100 rounded-b-lg p-4"
          onClick={() => !forceReadOnly && setSelectedItems([])}
        >
          {/* Render each sub‐item */}
          {localSubItems.map(renderItem)}

          {/* Render lines for relationships */}
          <svg className="absolute inset-0 pointer-events-none">
            {localRelationships.map((rel) => {
              const source = localSubItems.find((item) => item.id === rel.sourceId);
              const target = localSubItems.find((item) => item.id === rel.targetId);
              if (!source || !target) return null;

              const sourcePos = source.position || { left: 0, top: 0 };
              const targetPos = target.position || { left: 0, top: 0 };

              return (
                <line
                  key={rel.id}
                  x1={sourcePos.left + 15}
                  y1={sourcePos.top + 15}
                  x2={targetPos.left + 15}
                  y2={targetPos.top + 15}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              );
            })}
          </svg>

          {/* Empty State */}
          {(!localSubItems || localSubItems.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              {isEditing && !forceReadOnly ? "Drag and drop items here" : "No items added"}
            </div>
          )}
        </div>
      </div>
    </BaseDraggable>
  );
}

export default CustomComponent;
