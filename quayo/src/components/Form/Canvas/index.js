import React, { useState, useEffect, useRef } from "react";
import { useDrop } from "react-dnd";
import { motion } from "framer-motion";
import { Palette, Check } from "lucide-react";

import TrueFalse from "../../../questiontemps/TrueFalse";
import ImageUpload from "../../../questiontemps/ImageUpload";
import FormattedTextItem from "../../../questiontemps/FormattedTextItem";
import MCSingleSelect from "../../../questiontemps/MCSingleSelect";
import MCMultipleSelect from "../../../questiontemps/MCMultipleSelect";
import LineComponent from "../../../questiontemps/LineComponent";
import ShortTextAnswer from "../../../questiontemps/ShortTextAnswer";
import SingleCheckboxItem from "../../../questiontemps/SingleCheckboxItem";
import ToggleButtonItem from "../../../questiontemps/ToggleButtonItem";
import NumericSlider from "../../../questiontemps/NumericSlider";
import DiscreteSlider from "../../../questiontemps/DiscreteSlider";
import RankingComponent from "../../../questiontemps/RankingComponent";
import MatchingPairsComponent from "../../../questiontemps/MatchingPairsComponent";
import ShapeComponent from "../../../questiontemps/ShapeComponent";

const ORIGINAL_WIDTH = 800;
const ORIGINAL_HEIGHT = 600;

const getComponentDimensions = (type, shapeType) => {
  switch (type) {
    case "true_false": return { width: 128, height: 56 };
    case "image_upload": return { width: 160, height: 160 };
    case "multiple_choice_single": return { width: 288, height: 200 };
    case "multiple_choice_multi": return { width: 288, height: 200 };
    case "text": return { width: 256, height: 64 };
    case "short_text_answer": return { width: 256, height: 64 };
    case "single_checkbox": return { width: 48, height: 48 };
    case "toggle_button": return { width: 100, height: 40 };
    case "numeric_slider": return { width: 320, height: 160 };
    case "discrete_slider": return { width: 320, height: 160 };
    case "ranking": return { width: 320, height: 220 };
    case "matching_pairs": return { width: 400, height: 200 };
    case "shape": 
      if (shapeType === "circle") return { width: 100, height: 100 };
      if (shapeType === "triangle") return { width: 100, height: 100 };
      return { width: 100, height: 100 };
    default: return { width: 150, height: 80 };
  }
};

const Canvas = ({
  formRef,
  question,
  onComponentUpdate,
  onDeleteComponent,
  onQuestionUpdate,
  showFormInfo,
  handleDrop,
  windowWidth,
  windowHeight,
  isLeftSidebarOpen,
  leftSidebarWidth = 0,
  isRightSidebarOpen,
  rightSidebarWidth = 0,
}) => {
  const canvasRef = useRef(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: "component",
    drop: (item, monitor) => {
      if (!formRef.current) return;
      
      const isNewComponent = !item.initialPosition;
      
      if (isNewComponent) {
        if (question.components.length >= 25) {
          return; // Silently fail since handleDrop will show the toast
        }
        const dims = item.dimensions || getComponentDimensions(item.type, item.shapeType);
        const centerX = ORIGINAL_WIDTH / 2 - dims.width / 2;
        const centerY = ORIGINAL_HEIGHT /  - dims.height / 2;

        handleDrop(item, centerX, centerY);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  useEffect(() => {
    const handleComponentDropped = (e) => {
      const { id, type, x, y } = e.detail;
      if (id !== undefined) {
        handleDrop({ id, type }, x, y);
      }
    };

    window.addEventListener("componentDropped", handleComponentDropped);
    return () => {
      window.removeEventListener("componentDropped", handleComponentDropped);
    };
  }, [handleDrop]);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempColor, setTempColor] = useState("#FFFFFF");
  const colorPickerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [viewportData, setViewportData] = useState({
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT
  });

  useEffect(() => {
    if (question) {
      setTempColor(question.backgroundColor || "#FFFFFF");
    }
  }, [question]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
        setTempColor(question ? question.backgroundColor || "#FFFFFF" : "#FFFFFF");
      }
    };
    
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker, question]);

  useEffect(() => {
    const calculateCanvasDimensions = () => {
      const topNavHeight = 64;
      const bottomToolbarHeight = 100;
      const availablePadding = 24;
      
      let availableWidth = windowWidth;
      if (isLeftSidebarOpen && windowWidth >= 768) {
        availableWidth -= leftSidebarWidth;
      }
      if (isRightSidebarOpen && windowWidth >= 768) {
        availableWidth -= rightSidebarWidth;
      }
      
      availableWidth -= availablePadding * 2;
      const availableHeight = windowHeight - topNavHeight - bottomToolbarHeight - availablePadding * 2;
      
      const widthScale = availableWidth / ORIGINAL_WIDTH;
      const heightScale = availableHeight / ORIGINAL_HEIGHT;
      
      const newScale = Math.min(widthScale, heightScale, 1);
      setScale(Math.max(0.3, newScale));
      
      const scaledWidth = ORIGINAL_WIDTH * newScale;
      const scaledHeight = ORIGINAL_HEIGHT * newScale;
      
      setViewportData({
        width: scaledWidth,
        height: scaledHeight
      });
    };
    
    calculateCanvasDimensions();
  }, [windowWidth, windowHeight, isLeftSidebarOpen, isRightSidebarOpen, leftSidebarWidth, rightSidebarWidth]);

  if (!question) {
    return (
      <motion.div className="px-6 py-8">
        <div className="text-gray-400 text-center">No question selected.</div>
      </motion.div>
    );
  }

  const handleSaveColor = () => {
    onQuestionUpdate(question.id, { backgroundColor: tempColor });
    setShowColorPicker(false);
  };

  const handleWheel = (e) => {
    e.stopPropagation();
  };

  const handleScrollCapture = (e) => {
    e.stopPropagation();
  };

  return (
    <motion.div
      className="px-4 md:px-6 py-8"
      style={{
        filter: showFormInfo ? "blur(4px)" : "none",
        transition: "filter 0.2s ease-out",
        userSelect: "none"
      }}
    >
      <div className="flex justify-center items-start">
        <div 
          className="relative"
          ref={canvasRef}
          onWheelCapture={handleScrollCapture}
        >
          <div 
            className="relative mx-auto overflow-hidden bg-white rounded-xl shadow-sm"
            style={{ 
              width: `${viewportData.width}px`, 
              height: `${viewportData.height}px`,
              zIndex: 5
            }}
            onWheel={handleWheel}
          >
            <div
              ref={(node) => {
                formRef.current = node;
                drop(node);
              }}
              className={`absolute top-0 left-0 origin-top-left ${
                isOver ? "ring-2 ring-blue-400" : ""
              }`}
              style={{ 
                backgroundColor: question.backgroundColor || "#FFFFFF",
                width: `${ORIGINAL_WIDTH}px`,
                height: `${ORIGINAL_HEIGHT}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
            >
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={() => {
                    setShowColorPicker((prev) => !prev);
                    setTempColor(question.backgroundColor || "#FFFFFF");
                  }}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Change Background Color"
                >
                  <Palette size={20} />
                </button>
                {showColorPicker && (
                  <div
                    ref={colorPickerRef}
                    className="absolute top-12 left-0 bg-white rounded-lg shadow-lg border p-2 z-20 flex items-center gap-2"
                  >
                    <input
                      type="color"
                      value={tempColor}
                      onChange={(e) => setTempColor(e.target.value)}
                      className="w-10 h-10 cursor-pointer p-0 border-none"
                    />
                    <div
                      className="w-10 h-10 rounded border border-gray-200"
                      style={{ backgroundColor: tempColor }}
                    />
                    <button
                      onClick={handleSaveColor}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <Check size={16} />
                      <span className="text-sm">Save</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
                <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-500"
                      >
                        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.3 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500" htmlFor="pointsField">
                        Points
                      </label>
                      <input
                        id="pointsField"
                        type="text"
                        className="w-16 text-sm font-semibold text-gray-700 focus:outline-none"
                        value={question.points || ""}
                        onChange={(e) => {
                          if (onQuestionUpdate) {
                            onQuestionUpdate(question.id, { points: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-px h-8 bg-gray-200"></div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-purple-500"
                      >
                        <path d="M12 20v-6M6 20V10M18 20V4" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500" htmlFor="maxAttemptsField">
                        Max Attempts
                      </label>
                      <input
                        id="maxAttemptsField"
                        type="text"
                        className="w-16 text-sm font-semibold text-gray-700 focus:outline-none"
                        value={question.maxAttempts || ""}
                        onChange={(e) => {
                          if (onQuestionUpdate) {
                            onQuestionUpdate(question.id, { maxAttempts: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {question.components?.map((comp) => {
                const commonProps = {
                  key: comp.id,
                  id: comp.id,
                  onDelete: () => onDeleteComponent(question.id, comp.id),
                  scale: scale,
                };

                switch (comp.type) {
                  case "true_false":
                    return (
                      <TrueFalse
                        {...commonProps}
                        position={comp.position}
                        value={comp.value}
                        width={comp.width || 128}
                        height={comp.height || 56}
                        setValue={(cid, val) =>
                          onComponentUpdate(question.id, cid, { value: val })
                        }
                        onUpdate={(cid, update) =>
                          onComponentUpdate(question.id, cid, update)
                        }
                      />
                    );
                  case "image_upload":
                    return (
                      <ImageUpload
                        {...commonProps}
                        position={comp.position}
                        image={comp.image}
                        width={comp.width}
                        height={comp.height}
                        setImage={(cid, newBase64) =>
                          onComponentUpdate(question.id, cid, { image: newBase64 })
                        }
                        setSize={(cid, sizeObj) =>
                          onComponentUpdate(question.id, cid, sizeObj)
                        }
                      />
                    );
                  case "text":
                    return (
                      <FormattedTextItem
                        {...commonProps}
                        position={comp.position}
                        text={comp.text}
                        width={comp.width}
                        height={comp.height}
                        setText={(cid, text, format) =>
                          onComponentUpdate(question.id, cid, { 
                            text: { text, format }
                          })
                        }
                        onResize={(cid, dimensions) =>
                          onComponentUpdate(question.id, cid, dimensions)
                        }
                      />
                    );
                  case "multiple_choice_single":
                    return (
                      <MCSingleSelect
                        {...commonProps}
                        position={comp.position}
                        options={comp.options}
                        correctIndex={comp.correctIndex}
                        width={comp.width || 288}
                        height={comp.height || 200}
                        updateMCsingle={(cid, update) =>
                          onComponentUpdate(question.id, cid, update)
                        }
                      />
                    );
                  case "multiple_choice_multi":
                    return (
                      <MCMultipleSelect
                        {...commonProps}
                        position={comp.position}
                        options={comp.options}
                        correctAnswers={comp.correctAnswers}
                        width={comp.width || 288}
                        height={comp.height || 200}
                        updateMCmulti={(cid, update) =>
                          onComponentUpdate(question.id, cid, update)
                        }
                      />
                    );
                  case "line":
                    return (
                      <LineComponent
                        {...commonProps}
                        canvasWidth={ORIGINAL_WIDTH}
                        canvasHeight={ORIGINAL_HEIGHT}
                        x1={comp.x1}
                        y1={comp.y1}
                        x2={comp.x2}
                        y2={comp.y2}
                        updateLine={(cid, updates) =>
                          onComponentUpdate(question.id, cid, updates)
                        }
                      />
                    );
                  case "short_text_answer":
                    return (
                      <ShortTextAnswer
                        {...commonProps}
                        position={comp.position}
                        correctAnswer={comp.correctAnswer}
                        setCorrectAnswer={(cid, newVal) =>
                          onComponentUpdate(question.id, cid, { correctAnswer: newVal })
                        }
                      />
                    );
                  case "single_checkbox":
                    return (
                      <SingleCheckboxItem
                        {...commonProps}
                        position={comp.position}
                        correctValue={comp.correctValue}
                        setCorrectValue={(cid, newVal) =>
                          onComponentUpdate(question.id, cid, { correctValue: newVal })
                        }
                        setSize={(cid, sizeObj) =>
                          onComponentUpdate(question.id, cid, sizeObj)
                        }
                      />
                    );
                  case "toggle_button":
                    return (
                      <ToggleButtonItem
                        {...commonProps}
                        position={comp.position}
                        toggled={comp.toggled}
                        width={comp.width}
                        height={comp.height}
                        opacity={comp.opacity ?? 1}
                        setToggleValue={(cid, newVal) =>
                          onComponentUpdate(question.id, cid, { toggled: newVal })
                        }
                        setSize={(cid, sizeObj) =>
                          onComponentUpdate(question.id, cid, sizeObj)
                        }
                        setOpacityValue={(cid, val) =>
                          onComponentUpdate(question.id, cid, { opacity: val })
                        }
                      />
                    );
                  case "numeric_slider":
                    return (
                      <NumericSlider
                        {...commonProps}
                        position={comp.position}
                        minValue={comp.minValue}
                        maxValue={comp.maxValue}
                        targetValue={comp.targetValue}
                        currentValue={comp.currentValue}
                        mode={comp.mode}
                        width={comp.width}
                        height={comp.height}
                        onUpdate={(cid, updates) =>
                          onComponentUpdate(question.id, cid, updates)
                        }
                      />
                    );
                  case "discrete_slider":
                    return (
                      <DiscreteSlider
                        {...commonProps}
                        position={comp.position}
                        options={comp.options}
                        selectedIndex={comp.selectedIndex}
                        width={comp.width}
                        height={comp.height}
                        onUpdate={(cid, updates) =>
                          onComponentUpdate(question.id, cid, updates)
                        }
                      />
                    );
                  case "ranking":
                    return (
                      <RankingComponent
                        {...commonProps}
                        position={comp.position}
                        items={comp.items}
                        correctOrder={comp.correctOrder}
                        width={comp.width}
                        height={comp.height}
                        onUpdate={(cid, updates) =>
                          onComponentUpdate(question.id, cid, updates)
                        }
                      />
                    );
                  case "matching_pairs":
                    return (
                      <MatchingPairsComponent
                        {...commonProps}
                        position={comp.position}
                        pairs={comp.pairs}
                        width={comp.width}
                        height={comp.height}
                        onUpdate={(cid, updates) =>
                          onComponentUpdate(question.id, cid, updates)
                        }
                      />
                    );
                  case "shape":
                    return (
                      <ShapeComponent
                        {...commonProps}
                        position={comp.position}
                        width={comp.width}
                        height={comp.height}
                        shapeType={comp.shapeType}
                        backgroundColor={comp.backgroundColor}
                        borderRadius={comp.borderRadius}
                        opacity={comp.opacity}
                        rotation={comp.rotation}
                        borderWidth={comp.borderWidth}
                        borderColor={comp.borderColor}
                        borderStyle={comp.borderStyle}
                        onUpdate={(cid, updates) =>
                          onComponentUpdate(question.id, cid, updates)
                        }
                      />
                    );
                  default:
                    return null;
                }
              })}

              {(!question.components || question.components.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Drag and drop components here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


export default Canvas