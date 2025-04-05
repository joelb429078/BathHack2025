// src/components/QuizCanvas.js

import React from "react";

// Import your existing question components
import TrueFalse from "../questiontemps/TrueFalse";
import ImageUpload from "../questiontemps/ImageUpload";
import TextItem from "../questiontemps/TextItem";
import MCSingleSelect from "../questiontemps/MCSingleSelect";
import MCMultipleSelect from "../questiontemps/MCMultipleSelect";
import CustomComponent from "../questiontemps/CustomComponent";

/**
 * Renders one question's components in a "read-only" style.
 * 
 * question = {
 *   id: 1,
 *   components: [
 *     { id, type, position: { left, top }, ... }
 *   ]
 * }
 */
const QuizCanvas = ({ question }) => {
  // If no components, show a placeholder
  if (!question?.components?.length) {
    return (
      <div className="p-4 border rounded bg-white text-gray-500">
        No components in this question.
      </div>
    );
  }

  return (
    <div 
      className="relative w-[800px] h-[600px] bg-white rounded shadow-sm"
      style={{ overflow: "hidden" }}
    >
      {question.components.map((comp) => {
        const style = {
          position: "absolute",
          left: comp.position?.left ?? 0,
          top: comp.position?.top ?? 0,
        };

        switch (comp.type) {
          case "true_false":
            return (
              <div key={comp.id} style={style}>
                {/* 
                  If TrueFalse has "editing" logic, 
                  either remove it or adapt for read-only 
                */}
                <TrueFalse
                  id={comp.id}
                  value={comp.value}
                  readOnly={true}
                />
              </div>
            );

          case "image_upload":
            return (
              <div key={comp.id} style={style}>
                <ImageUpload
                  id={comp.id}
                  image={comp.image}
                  readOnly={true}
                />
              </div>
            );

          case "text":
            return (
              <div key={comp.id} style={style}>
                <TextItem
                  id={comp.id}
                  text={comp.text}
                  readOnly={true}
                />
              </div>
            );

          case "multiple_choice_single":
            return (
              <div key={comp.id} style={style}>
                <MCSingleSelect
                  id={comp.id}
                  options={comp.options}
                  correctIndex={comp.correctIndex}
                  readOnly={true}
                />
              </div>
            );

          case "multiple_choice_multi":
            return (
              <div key={comp.id} style={style}>
                <MCMultipleSelect
                  id={comp.id}
                  options={comp.options}
                  correctAnswers={comp.correctAnswers}
                  readOnly={true}
                />
              </div>
            );

          case "custom_component":
            return (
              <div key={comp.id} style={style}>
                <CustomComponent id={comp.id} readOnly={true} />
              </div>
            );

          default:
            return (
              <div key={comp.id} style={style}>
                <p className="text-sm text-red-500">
                  Unknown component type: {comp.type}
                </p>
              </div>
            );
        }
      })}
    </div>
  );
};

export default QuizCanvas;
