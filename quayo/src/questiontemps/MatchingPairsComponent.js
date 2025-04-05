import React, { useState } from 'react';
import BaseDraggable from './BaseDraggable';
import { SplitSquareHorizontal, Plus, X, Edit2, Check, ArrowRight } from 'lucide-react';

const MatchingPairsComponent = ({
  id,
  position,
  pairs = [],
  onUpdate,
  onDelete,
  width = 400,
  height = 200,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [newLeft, setNewLeft] = useState('');
  const [newRight, setNewRight] = useState('');

  const baseHeight = 200;
  const baseFontSize = 14;
  const computedFontSize = Math.min(
    Math.max(baseFontSize * (1 + ((height / baseHeight - 1) / 3)), 12),
    24
  );

  const handleAddPair = () => {
    if (!newLeft.trim() || !newRight.trim()) return;
    const newPairs = [...pairs, { left: newLeft, right: newRight }];
    onUpdate(id, { pairs: newPairs });
    setNewLeft('');
    setNewRight('');
    setIsAddingNew(false);
  };

  const handleEditCell = (index, side, value) => {
    const newPairs = [...pairs];
    newPairs[index] = {
      ...newPairs[index],
      [side]: value
    };
    onUpdate(id, { pairs: newPairs });
    setEditingCell(null);
  };

  const handleDeletePair = (index) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    onUpdate(id, { pairs: newPairs });
  };

  const shufflePairs = () => {
    const rightSide = pairs.map(p => p.right);
    for (let i = rightSide.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rightSide[i], rightSide[j]] = [rightSide[j], rightSide[i]];
    }
    const shuffledPairs = pairs.map((p, idx) => ({
      left: p.left,
      right: rightSide[idx]
    }));
    onUpdate(id, { pairs: shuffledPairs });
  };

  return (
    <BaseDraggable
      id={id}
      type="matching_pairs"
      position={position}
      width={width}
      height={height}
      onDelete={onDelete}
      onResize={(_, dimensions) => onUpdate(id, dimensions)}
      minWidth={400}
      minHeight={200}
      style={{
        width,
        height,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
      className="group"
    >
      <div className="h-full flex flex-col bg-white rounded-lg border-2 border-gray-200">
        {/* Header */}
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <div className="font-medium text-gray-700 flex items-center gap-2">
            <SplitSquareHorizontal size={computedFontSize + 2} />
            <span style={{ fontSize: computedFontSize }}>Matching Pairs</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={shufflePairs}
                className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                data-nodrag="true"
              >
                Shuffle
              </button>
            )}
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setIsAddingNew(false);
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
              data-nodrag="true"
            >
              <Edit2 size={computedFontSize} />
            </button>
          </div>
        </div>

        {/* Headers */}
        <div className="grid grid-cols-2 px-4 py-2 border-b text-gray-600 font-medium" style={{ fontSize: computedFontSize - 1 }}>
          <div>Left Items</div>
          <div>Right Items</div>
        </div>

        {/* Pairs Container */}
        <div className="flex-1 flex flex-col min-h-0">
          {pairs.map((pair, index) => (
            <div key={index} className="flex-1 flex min-h-0 border-b last:border-b-0">
              {/* Left Item */}
              <div className="flex-1 flex items-center px-4">
                {editingCell === `${index}-left` ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={pair.left}
                      onChange={(e) => {
                        const newPairs = [...pairs];
                        newPairs[index].left = e.target.value;
                        onUpdate(id, { pairs: newPairs });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditCell(index, 'left', pair.left);
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: computedFontSize - 1 }}
                      data-nodrag="true"
                    />
                    <button
                      onClick={() => handleEditCell(index, 'left', pair.left)}
                      className="p-1 rounded-full hover:bg-green-100 text-green-600"
                      data-nodrag="true"
                    >
                      <Check size={computedFontSize - 1} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => isEditing && setEditingCell(`${index}-left`)}
                    className="w-full text-left py-2 px-2 rounded hover:bg-gray-50"
                    style={{ fontSize: computedFontSize - 1 }}
                    data-nodrag="true"
                  >
                    {pair.left}
                  </button>
                )}
              </div>

              {/* Connector */}
              <div className="flex items-center justify-center w-8">
                <ArrowRight className="text-gray-400" size={computedFontSize} />
              </div>

              {/* Right Item */}
              <div className="flex-1 flex items-center px-4">
                <div className="flex-1 flex items-center gap-2">
                  {editingCell === `${index}-right` ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        value={pair.right}
                        onChange={(e) => {
                          const newPairs = [...pairs];
                          newPairs[index].right = e.target.value;
                          onUpdate(id, { pairs: newPairs });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditCell(index, 'right', pair.right);
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: computedFontSize - 1 }}
                        data-nodrag="true"
                      />
                      <button
                        onClick={() => handleEditCell(index, 'right', pair.right)}
                        className="p-1 rounded-full hover:bg-green-100 text-green-600"
                        data-nodrag="true"
                      >
                        <Check size={computedFontSize - 1} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <button
                        onClick={() => isEditing && setEditingCell(`${index}-right`)}
                        className="flex-1 text-left py-2 px-2 rounded hover:bg-gray-50"
                        style={{ fontSize: computedFontSize - 1 }}
                        data-nodrag="true"
                      >
                        {pair.right}
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => handleDeletePair(index)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 text-red-500"
                          data-nodrag="true"
                        >
                          <X size={computedFontSize - 1} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add New Pair */}
          {isEditing && (
            <div className="border-t px-4 py-2">
              {isAddingNew ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      value={newLeft}
                      onChange={(e) => setNewLeft(e.target.value)}
                      placeholder="New left item..."
                      className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: computedFontSize - 1 }}
                      data-nodrag="true"
                    />
                  </div>
                  <div className="w-8 flex justify-center">
                    <ArrowRight className="text-gray-400" size={computedFontSize} />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={newRight}
                      onChange={(e) => setNewRight(e.target.value)}
                      placeholder="New right item..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddPair();
                        else if (e.key === 'Escape') {
                          setIsAddingNew(false);
                          setNewLeft('');
                          setNewRight('');
                        }
                      }}
                      className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: computedFontSize - 1 }}
                      data-nodrag="true"
                    />
                    <button
                      onClick={handleAddPair}
                      disabled={!newLeft.trim() || !newRight.trim()}
                      className="p-1.5 rounded-full hover:bg-blue-100 text-blue-500 disabled:opacity-50"
                      data-nodrag="true"
                    >
                      <Plus size={computedFontSize} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                  style={{ fontSize: computedFontSize - 1 }}
                  data-nodrag="true"
                >
                  <Plus size={computedFontSize} />
                  Add Pair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseDraggable>
  );
};

export default MatchingPairsComponent;