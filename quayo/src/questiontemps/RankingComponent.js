import React, { useState } from 'react';
import BaseDraggable from './BaseDraggable';
import { ListOrdered, GripVertical, Plus, X, Edit2 } from 'lucide-react';

const RankingComponent = ({
  id,
  position,
  items = [],
  correctOrder = [],
  onUpdate,
  onDelete,
  width = 288,
  height = 200,
  scale = 1, // Add scale prop
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Base values for scaling - exactly like MCSingleSelect
  const baseHeight = 200;
  const baseFontSize = 14;
  const computedFontSize = Math.min(
    Math.max(baseFontSize * (1 + ((height / baseHeight - 1) / 3)), 12),
    24
  );
  const dynamicPadding = height * 0.05;

  const handleDragStart = (e, index) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) return;
    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);
    const newCorrectOrder = newItems.map((_, i) => i);
    onUpdate(id, { items: newItems, correctOrder: newCorrectOrder });
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItems = [...items, newItemText];
    onUpdate(id, { items: newItems });
    setNewItemText('');
    setIsAddingNew(false);
  };

  const handleResize = (componentId, dimensions) => {
    onUpdate(id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  return (
    <BaseDraggable
      id={id}
      type="ranking"
      position={position}
      width={width}
      height={height}
      className="group"
      onDelete={onDelete}
      onResize={handleResize}
      style={{
        width,
        height,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
      minWidth={240}
      minHeight={120}
      scale={scale} // Pass scale to BaseDraggable
    >
      <div 
        className="flex flex-col h-full bg-white rounded-lg border-2 border-gray-200"
        style={{ padding: dynamicPadding }}
      >
        {/* Header with Edit Button */}
        <div
          style={{
            marginBottom: dynamicPadding / 2,
            fontSize: baseFontSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-2">
            <ListOrdered size={baseFontSize + 4} />
            <span>Ranking Question</span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
            data-nodrag="true"
          >
            <Edit2 size={baseFontSize} />
          </button>
        </div>

        {/* Items Container */}
        <div
          className="flex-1 overflow-auto"
          style={{ marginBottom: dynamicPadding / 2 }}
        >
          <div className="flex flex-col h-full space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className="flex flex-1 items-center gap-2 group border rounded-md cursor-move"
                style={{
                  padding: `${dynamicPadding / 4}px 0`,
                  fontSize: computedFontSize,
                }}
                data-nodrag="true"
              >
                <div className="ml-2 text-gray-400">
                  <GripVertical size={computedFontSize} />
                </div>

                <span className="w-6 font-medium">
                  {idx + 1}.
                </span>

                <span className="flex-1 truncate px-2">
                  {item}
                </span>

                {isEditing && (
                  <button
                    onClick={() => {
                      const newItems = items.filter((_, i) => i !== idx);
                      onUpdate(id, { items: newItems });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded-full hover:bg-red-100 text-red-500 transition-opacity"
                    data-nodrag="true"
                  >
                    <X size={computedFontSize} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Add Option */}
        <div style={{ marginTop: dynamicPadding / 2 }}>
          {isAddingNew ? (
            <div className="flex items-center gap-2">
              <span className="text-blue-500">
                <Plus size={computedFontSize + 2} />
              </span>
              <input
                autoFocus
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem();
                  else if (e.key === 'Escape') {
                    setIsAddingNew(false);
                    setNewItemText('');
                  }
                }}
                onBlur={() => {
                  if (newItemText.trim()) handleAddItem();
                  else setIsAddingNew(false);
                }}
                className="flex-1 px-2 py-1 border rounded-md focus:outline-none"
                placeholder="New item..."
                style={{ fontSize: computedFontSize }}
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
              Add Item
            </button>
          )}
        </div>
      </div>
    </BaseDraggable>
  );
};

export default RankingComponent;