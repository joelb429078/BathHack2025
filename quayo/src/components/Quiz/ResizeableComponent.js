// src/components/Quiz/ResizableComponent.js
import React from 'react';
import { getComponentStyle } from './QuizTheme';

const ResizableComponent = ({ comp, defaultWidth, defaultHeight, children, extraStyle = {} }) => {
  // Get the component's style using the helper function
  const baseStyle = getComponentStyle(comp, defaultWidth, defaultHeight);
  
  return (
    <div 
      className="question-component" 
      style={{ 
        ...baseStyle, 
        ...extraStyle,
        // When using center-center transform origin for the canvas,
        // we need to adjust the positions of elements relative to the center
        transformOrigin: 'center center'
      }}
    >
      <div style={{ width: "100%", height: "100%" }}>{children}</div>
    </div>
  );
};

export default ResizableComponent;