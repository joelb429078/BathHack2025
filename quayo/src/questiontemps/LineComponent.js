import React, { useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * A small draggable circle for an endpoint.
 * We call e.stopPropagation() so it doesn't trigger the line's drag logic.
 */
function EndpointHandle({ cx, cy, onDrag, color = "#000" }) {
  const handleRef = useRef(null);

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the line from also dragging
    handleRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    // e.buttons===1 => left mouse button
    if (e.buttons === 1 && onDrag) {
      onDrag(e.movementX, e.movementY);
    }
  };

  const handlePointerUp = (e) => {
    handleRef.current.releasePointerCapture(e.pointerId);
  };

  return (
    <circle
      ref={handleRef}
      cx={cx}
      cy={cy}
      r={6}
      fill="#fff"
      stroke={color}
      strokeWidth={2}
      style={{
        cursor: "grab",
        pointerEvents: "auto", // can drag/click the circle
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}

/**
 * A free‐standing line with:
 *   - black stroke
 *   - endpoints that only move themselves (like extending in PowerPoint)
 *   - drag entire line from the body
 *   - delete button near midpoint
 */
const LineComponent = ({
  id,
  canvasWidth = 800,
  canvasHeight = 600,

  // Endpoints
  x1,
  y1,
  x2,
  y2,

  onDelete,
  updateLine, // => (id, { x1,y1,x2,y2 })
}) => {
  const lineRef = useRef(null);
  const [isDraggingLine, setIsDraggingLine] = useState(false);

  // ----- DRAG ENDPOINTS -----
  // Move endpoint #1 => only update x1,y1
  const handleDragStart = (dx, dy) => {
    updateLine(id, {
      x1: x1 + dx,
      y1: y1 + dy,
    });
  };
  // Move endpoint #2 => only update x2,y2
  const handleDragEnd = (dx, dy) => {
    updateLine(id, {
      x2: x2 + dx,
      y2: y2 + dy,
    });
  };

  // ----- DRAG ENTIRE LINE BODY -----
  const handleLinePointerDown = (e) => {
    e.preventDefault();
    // capture pointer => we keep receiving pointerMove
    lineRef.current.setPointerCapture(e.pointerId);
    setIsDraggingLine(true);
  };

  const handleLinePointerMove = (e) => {
    if (!isDraggingLine || e.buttons !== 1) return;
    const dx = e.movementX;
    const dy = e.movementY;
    // Move entire line => shift both endpoints
    updateLine(id, {
      x1: x1 + dx,
      y1: y1 + dy,
      x2: x2 + dx,
      y2: y2 + dy,
    });
  };

  const handleLinePointerUp = (e) => {
    lineRef.current.releasePointerCapture(e.pointerId);
    setIsDraggingLine(false);
  };

  // Midpoint => "X"
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: "none",
      }}
    >
      <svg
        ref={lineRef}
        width="100%"
        height="100%"
        style={{
          pointerEvents: "none", // children re‐enable pointer
          background: "transparent",
        }}
        onPointerDown={handleLinePointerDown}
        onPointerMove={handleLinePointerMove}
        onPointerUp={handleLinePointerUp}
      >
        {/* The main line => pointerEvents="stroke" so circles can be clicked. */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#000"
          strokeWidth={2}
          style={{
            pointerEvents: "stroke", // Only the stroke is clickable, not bounding box
            cursor: "grab",
          }}
        />

        {/* Endpoint #1 */}
        <EndpointHandle cx={x1} cy={y1} onDrag={handleDragStart} color="#000" />

        {/* Endpoint #2 */}
        <EndpointHandle cx={x2} cy={y2} onDrag={handleDragEnd} color="#000" />

        {/* Delete button near midpoint => red rect + "X" */}
        <g
          transform={`translate(${midX}, ${midY})`}
          style={{ pointerEvents: "auto" }}
        >
          <rect
            x="-10"
            y="-10"
            width="20"
            height="20"
            fill="#fff"
            stroke="#e11d48"
            strokeWidth={1}
            rx={4}
            ry={4}
            style={{
              cursor: "pointer",
            }}
            onPointerDown={(e) => {
              e.stopPropagation(); // don't drag the line
            }}
            onClick={(e) => {
              e.stopPropagation(); // don't drag endpoints either
              onDelete?.(id);
            }}
          />
          <X
            size={16}
            color="#e11d48"
            style={{
              pointerEvents: "none",
            }}
            x="-8"
            y="-8"
          />
        </g>
      </svg>
    </div>
  );
};

export default LineComponent;
